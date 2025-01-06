import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp, Wallet, ExternalLink, Info, Settings, CreditCard } from 'lucide-react';

const BridgeConverter = () => {
  // Core state
  const [amount, setAmount] = useState('100');
  const [outputAmount, setOutputAmount] = useState('0');
  const [fromType, setFromType] = useState('fiat');
  const [selectedFromAsset, setSelectedFromAsset] = useState('USD');
  const [selectedToAsset, setSelectedToAsset] = useState('PI');
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState('0.5');

  // Asset definitions with current market rates
  const assets = {
    fiat: [
      { code: 'USD', name: 'US Dollar', rate: 1 },
      { code: 'EUR', name: 'Euro', rate: 0.92 },
      { code: 'GBP', name: 'British Pound', rate: 0.79 }
    ],
    crypto: [
      { code: 'BTC', name: 'Bitcoin', price: 100000, network: 'Bitcoin', fee: 0.0001 },
      { code: 'ETH', name: 'Ethereum', price: 5420, network: 'Ethereum', fee: 0.0015 },
      { code: 'PI', name: 'Pi', price: 50, network: 'Pi', fee: 0.001, isNew: true },
      { code: 'XMR', name: 'Monero', price: 720, network: 'Monero', fee: 0.01 },
      { code: 'XMRT', name: 'XMRT', price: 0.85, network: 'XMRT', fee: 0.002, isNew: true },
      { code: 'BNB', name: 'BNB', price: 855, network: 'BSC', fee: 0.0005 },
      { code: 'SOL', name: 'Solana', price: 275, network: 'Solana', fee: 0.0001 },
      { code: 'USDT', name: 'USDT', price: 1.0001, network: 'Ethereum', fee: 0.0015 },
      { code: 'USDC', name: 'USDC', price: 1, network: 'Ethereum', fee: 0.0015 }
    ]
  };

  // Calculate conversion
  useEffect(() => {
    const inputValue = parseFloat(amount) || 0;
    let outputValue = 0;

    if (fromType === 'fiat') {
      const fromAsset = assets.fiat.find(a => a.code === selectedFromAsset);
      const toAsset = assets.crypto.find(a => a.code === selectedToAsset);
      outputValue = (inputValue / fromAsset.rate) / toAsset.price;
    } else {
      const fromAsset = assets.crypto.find(a => a.code === selectedFromAsset);
      const toAsset = assets.crypto.find(a => a.code === selectedToAsset);
      outputValue = (inputValue * fromAsset.price) / toAsset.price;
    }

    // Apply slippage
    outputValue *= (1 - parseFloat(slippage) / 100);
    setOutputAmount(outputValue.toFixed(6));
  }, [amount, selectedFromAsset, selectedToAsset, fromType, slippage]);

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

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const projectId = "93d6f5f37345b4cf181b296567177797";
      setWalletAddress('pi1234...5678');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
    setIsConnecting(false);
  };

  const getSelectedAsset = (type, code) => {
    return type === 'fiat' ? 
      assets.fiat.find(a => a.code === code) :
      assets.crypto.find(a => a.code === code);
  };

  const getNetworkFee = () => {
    const asset = assets.crypto.find(a => a.code === selectedToAsset);
    return asset ? (asset.fee * asset.price).toFixed(3) : 0;
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return price.toLocaleString();
    } else if (price < 0.01) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      <Card className="border-purple-100">
        <CardContent className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-purple-600">Pi Puente</h2>
              <span className="px-1.5 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                Red Principal
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
                <span className="text-gray-600">Tolerancia de Deslizamiento</span>
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
                Cambiar a {fromType === 'fiat' ? 'Cripto' : 'Fiat'}
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
                ≈ ${(parseFloat(amount) * getSelectedAsset('crypto', selectedFromAsset)?.price || 0).toFixed(2)}
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
                ≈ ${(parseFloat(outputAmount) * getSelectedAsset('crypto', selectedToAsset)?.price || 0).toFixed(2)}
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
              <span>{isConnecting ? 'Conectando...' : 'Conectar Billetera'}</span>
            </button>
          ) : (
            <div className="p-2 bg-purple-50/50 rounded-lg">
              <div className="text-xs text-gray-600 flex items-center justify-between">
                <span>{assets.crypto.find(a => a.code === selectedToAsset)?.network}</span>
                <span className="font-mono">{walletAddress}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button 
            disabled={!walletAddress}
            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {fromType === 'fiat' ? 'Comprar' : 'Transferir'} {selectedToAsset}
          </button>

          {/* Fees */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Comisión de Red</span>
              <span>${getNetworkFee()}</span>
            </div>
            {fromType === 'fiat' && (
              <div className="flex justify-between text-gray-600">
                <span>Procesamiento</span>
                <span>1.5%</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Deslizamiento</span>
              <span>{slippage}%</span>
            </div>
          </div>

          {/* Market Rate */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <div className="flex justify-between">
              <span>Tasa de Mercado Actual</span>
              <span>1 {selectedToAsset} = ${formatPrice(getSelectedAsset('crypto', selectedToAsset)?.price)}</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-1.5 text-xs text-gray-500">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <p>Las transacciones requieren verificación KYC y están aseguradas por {assets.crypto.find(a => a.code === selectedToAsset)?.network}</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-1 py-2">
        <div className="flex justify-center items-center space-x-3 text-xs text-gray-600">
          <a href="#" className="hover:text-purple-600">Términos</a>
          <span>•</span>
          <a href="#" className="hover:text-purple-600">Privacidad</a>
          <span>•</span>
          <a href="#" className="hover:text-purple-600">Soporte</a>
        </div>
        <div className="text-[10px] text-gray-400">
          © 2024 Pi Network • v1.0.0
        </div>
      </div>
    </div>
  );
};

export default BridgeConverter;
