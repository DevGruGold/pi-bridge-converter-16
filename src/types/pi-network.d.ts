interface PiPayment {
  // Add payment properties as needed
  id: string;
  amount: number;
  status: string;
}

interface PiUser {
  uid: string;
  // Add other user properties as needed
}

interface PiNetwork {
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: PiPayment) => void
  ) => Promise<{ user: PiUser }>;
  createPayment: (options: any) => Promise<PiPayment>;
}

interface Window {
  Pi?: PiNetwork;
}