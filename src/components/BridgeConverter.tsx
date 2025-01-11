import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp, Wallet, ExternalLink, Info, Settings, CreditCard } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/react';
import { useAccount, useConnect, useDisconnect, useBalance, useNetwork, useFeeData } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useToast } from "@/components/ui/use-toast";

interface FiatAsset {
  code: string;
  name: string;
  rate: number;
  type: 'fiat';
}

interface CryptoAsset {
  code: string;
  name: string;
  price: number;
  network: string;
  fee: number;
  isNew?: boolean;
  type: 'crypto';
}

type Asset = FiatAsset | CryptoAsset;

type Language = 'es' | 'en';

const translations = {
  es: {
    title: 'Pi Puente',
    mainNet: 'Red Principal',
    slippageTolerance: 'Tolerancia de Deslizamiento',
    switchTo: 'Cambiar a',
    crypto: 'Cripto',
    fiat: 'Fiat',
    connecting: 'Conectando...',
    connectWallet: 'Conectar Billetera',
    buy: 'Comprar',
    transfer: 'Transferir',
    networkFee: 'Comisión de Red',
    processing: 'Procesamiento',
    slippage: 'Deslizamiento',
    currentMarketRate: 'Tasa de Mercado Actual',
    securityNotice: 'Las transacciones requieren verificación KYC y están aseguradas por',
    terms: 'Términos',
    privacy: 'Privacidad',
    support: 'Soporte',
    language: 'Idioma',
  },
  en: {
    title: 'Pi Bridge',
    mainNet: 'Main Net',
    slippageTolerance: 'Slippage Tolerance',
    switchTo: 'Switch to',
    crypto: 'Crypto',
    fiat: 'Fiat',
    connecting: 'Connecting...',
    connectWallet: 'Connect Wallet',
    buy: 'Buy',
    transfer: 'Transfer',
    networkFee: 'Network Fee',
    processing: 'Processing',
    slippage: 'Slippage',
    currentMarketRate: 'Current Market Rate',
    securityNotice: 'Transactions require KYC verification and are secured by',
    terms: 'Terms',
    privacy: 'Privacy',
    support: 'Support',
    language: 'Language',
  }
};

const BridgeConverter = () => {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { data: feeData } = useFeeData();
  const { toast } = useToast();

  // Core state
  const [amount, setAmount] = useState('100');
  const [outputAmount, setOutputAmount] = useState('0');
  const [fromType, setFromType] = useState<'fiat' | 'crypto'>('fiat');
  const [selectedFromAsset, setSelectedFromAsset] = useState('USD');
  const [selectedToAsset, setSelectedToAsset] = useState('PI');
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [language, setLanguage] = useState<Language>('es');

  // Asset definitions with current market rates
  const assets = {
    fiat: [
      { code: 'USD', name: 'US Dollar', rate: 1, type: 'fiat' as const },
      { code: 'EUR', name: 'Euro', rate: 0.92, type: 'fiat' as const },
      { code: 'GBP', name: 'British Pound', rate: 0.79, type: 'fiat' as const }
    ],
    crypto: [
      { code: 'BTC', name: 'Bitcoin', price: 100000, network: 'Bitcoin', fee: 0.0001, type: 'crypto' as const },
      { code: 'ETH', name: 'Ethereum', price: 5420, network: 'Ethereum', fee: 0.0015, type: 'crypto' as const },
      { code: 'PI', name: 'Pi', price: 50, network: 'Pi', fee: 0.001, isNew: true, type: 'crypto' as const },
      { code: 'XMR', name: 'Monero', price: 720, network: 'Monero', fee: 0.01, type: 'crypto' as const },
      { code: 'XMRT', name: 'XMRT', price: 0.85, network: 'XMRT', fee: 0.002, isNew: true, type: 'crypto' as const },
      { code: 'BNB', name: 'BNB', price: 855, network: 'BSC', fee: 0.0005, type: 'crypto' as const },
      { code: 'SOL', name: 'Solana', price: 275, network: 'Solana', fee: 0.0001, type: 'crypto' as const },
      { code: 'USDT', name: 'USDT', price: 1.0001, network: 'Ethereum', fee: 0.0015, type: 'crypto' as const },
      { code: 'USDC', name: 'USDC', price: 1, network: 'Ethereum', fee: 0.0015, type: 'crypto' as const }
    ]
  };

  const isCryptoAsset = (asset: Asset): asset is CryptoAsset => {
    return asset.type === 'crypto';
  };

  const isFiatAsset = (asset: Asset): asset is FiatAsset => {
    return asset.type === 'fiat';
  };

  // Calculate conversion with proper dependency tracking
  useEffect(() => {
    const inputValue = parseFloat(amount) || 0;
    let outputValue = 0;

    if (fromType === 'fiat') {
      const fromAsset = assets.fiat.find(a => a.code === selectedFromAsset);
      const toAsset = assets.crypto.find(a => a.code === selectedToAsset);
      if (fromAsset && toAsset) {
        outputValue = (inputValue / fromAsset.rate) / toAsset.price;
      }
    } else {
      const fromAsset = assets.crypto.find(a => a.code === selectedFromAsset);
      const toAsset = assets.crypto.find(a => a.code === selectedToAsset);
      if (fromAsset && toAsset) {
        outputValue = (inputValue * fromAsset.price) / toAsset.price;
      }
    }

    // Apply slippage
    outputValue *= (1 - parseFloat(slippage) / 100);
    setOutputAmount(outputValue.toFixed(6));
  }, [amount, selectedFromAsset, selectedToAsset, fromType, slippage, assets]);

  // Get wallet balance for selected crypto
  const { data: walletBalance } = useBalance({
    address: address,
    token: selectedToAsset === 'ETH' ? undefined : '0x...' // Add token address when needed
  });

  // Calculate network fees based on current gas prices
  const calculateNetworkFee = () => {
    if (!feeData?.gasPrice) return '0';
    const baseGasUnits = 21000; // Basic ETH transfer
    const estimatedFee = parseFloat(formatEther(feeData.gasPrice * BigInt(baseGasUnits)));
    return estimatedFee.toFixed(6);
  };

  // Validate transaction
  const validateTransaction = () => {
    if (fromType === 'crypto' && walletBalance) {
      const inputValueBig = parseEther(amount);
      if (inputValueBig > walletBalance.value) {
        toast({
          title: "Insufficient balance",
          description: `You need ${amount} ${selectedFromAsset} but only have ${formatEther(walletBalance.value)}`,
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  // Handle transaction
  const handleTransaction = async () => {
    if (!validateTransaction()) return;

    try {
      // For on-ramp (buying crypto)
      if (fromType === 'fiat') {
        toast({
          title: "Processing purchase",
          description: `Buying ${outputAmount} ${selectedToAsset} with ${amount} ${selectedFromAsset}`,
        });
        // Implement payment processor integration here
      }
      // For off-ramp (selling crypto)
      else {
        toast({
          title: "Processing sale",
          description: `Selling ${amount} ${selectedFromAsset} for ${outputAmount} ${selectedToAsset}`,
        });
        // Implement crypto transfer and fiat payout here
      }
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Update getNetworkFee to use real gas prices
  const getNetworkFee = () => {
    const calculatedFee = calculateNetworkFee();
    const asset = assets.crypto.find(a => a.code === selectedToAsset);
    if (asset) {
      return (parseFloat(calculatedFee) * asset.price).toFixed(3);
    }
    return calculatedFee;
  };

  // Handlers
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const switchFromType = () => {
    if (fromType === 'fiat') {
      setFromType('crypto');
      setSelectedFromAsset('PI');
    } else {
      setFromType('fiat');
      setSelectedFromAsset('USD');
    }
  };

  // Update wallet address when Web3Modal connection changes
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    }
  }, [isConnected, address]);

  const getSelectedAsset = (type: 'fiat' | 'crypto', code: string): Asset | undefined => {
    return type === 'fiat' ? 
      assets.fiat.find(a => a.code === code) :
      assets.crypto.find(a => a.code === code);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString();
    } else if (price < 0.01) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  };

  const getAssetPrice = (asset: Asset | undefined): number => {
    if (!asset) return 0;
    return isCryptoAsset(asset) ? asset.price : 0;
  };

  const t = translations[language];

  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      <Card className="border-purple-100">
        <CardContent className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-purple-600">{t.title}</h2>
              <span className="px-1.5 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                {t.mainNet}
              </span>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Settings */}
          {showSettings && (
            <div className="p-2 bg-gray-50 rounded-lg text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t.slippageTolerance}</span>
                <select
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="bg-white border rounded px-2 py-1"
                >
                  <option value="0.5">0.5%</option>
                  <option value="1.0">1.0%</option>
                  <option value="2.0">2.0%</option>
                </select>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-gray-600">{t.language}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-white border rounded px-2 py-1"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="p-3 bg-purple-50/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {fromType === 'fiat' ? 
                  <CreditCard className="w-4 h-4 text-purple-400" /> :
                  <Wallet className="w-4 h-4 text-purple-400" />
                }
                <select 
                  value={selectedFromAsset}
                  onChange={(e) => setSelectedFromAsset(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none"
                >
                  {(fromType === 'fiat' ? assets.fiat : assets.crypto).map(asset => (
                    <option key={asset.code} value={asset.code}>
                      {asset.code} {asset.isNew ? '(New)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={switchFromType}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                {t.switchTo} {fromType === 'fiat' ? t.crypto : t.fiat}
              </button>
            </div>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="w-full text-xl font-bold bg-transparent border-none focus:outline-none"
              placeholder="0.00"
            />
            {fromType === 'crypto' && (
              <div className="text-xs text-gray-500">
                ≈ ${(parseFloat(amount) * getAssetPrice(getSelectedAsset('crypto', selectedFromAsset))).toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex justify-center -my-1.5">
            <div className="p-1 bg-white rounded-full border shadow-sm">
              <ArrowDownUp className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          {/* Output Section */}
          <div className="p-3 bg-purple-50/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-purple-400" />
                <select
                  value={selectedToAsset}
                  onChange={(e) => setSelectedToAsset(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none"
                >
                  {assets.crypto.map(asset => (
                    <option key={asset.code} value={asset.code}>
                      {asset.code} {asset.isNew ? '(New)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-gray-500">
                Network: {assets.crypto.find(a => a.code === selectedToAsset)?.network}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold">
                {outputAmount} {selectedToAsset}
              </div>
              <div className="text-xs text-gray-500">
                ≈ ${(parseFloat(outputAmount) * getAssetPrice(getSelectedAsset('crypto', selectedToAsset))).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? t.connecting : t.connectWallet}</span>
            </button>
          ) : (
            <div className="p-2 bg-purple-50/50 rounded-lg">
              <div className="text-xs text-gray-600 flex items-center justify-between">
                <span>{assets.crypto.find(a => a.code === selectedToAsset)?.network}</span>
                <span className="font-mono">{walletAddress}</span>
                {isConnected && (
                  <button
                    onClick={() => disconnect()}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button 
            disabled={!walletAddress || parseFloat(amount) <= 0}
            onClick={handleTransaction}
            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {fromType === 'fiat' ? t.buy : t.transfer} {selectedToAsset}
          </button>

          {/* Fees */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>{t.networkFee}</span>
              <span>${getNetworkFee()}</span>
            </div>
            {fromType === 'fiat' && (
              <div className="flex justify-between text-gray-600">
                <span>{t.processing}</span>
                <span>1.5%</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>{t.slippage}</span>
              <span>{slippage}%</span>
            </div>
          </div>

          {/* Market Rate */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="flex justify-between">
              <span>{t.currentMarketRate}</span>
              <span>1 {selectedToAsset} = ${formatPrice(getAssetPrice(getSelectedAsset('crypto', selectedToAsset)))}</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-1.5 text-xs text-gray-500">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <p>{t.securityNotice} {assets.crypto.find(a => a.code === selectedToAsset)?.network}</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-1 py-2">
        <div className="flex justify-center items-center space-x-3 text-xs text-gray-600">
          <a href="#" className="hover:text-purple-600">{t.terms}</a>
          <span>•</span>
          <a href="#" className="hover:text-purple-600">{t.privacy}</a>
          <span>•</span>
          <a href="#" className="hover:text-purple-600">{t.support}</a>
        </div>
        <div className="text-[10px] text-gray-400">
          © 2024 Pi Network • v1.0.0
        </div>
      </div>
    </div>
  );
};

export default BridgeConverter;
