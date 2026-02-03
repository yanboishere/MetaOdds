export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: 'stock' | 'crypto' | 'metal';
}

export const SUPPORTED_ASSETS: Asset[] = [
  { symbol: 'TSLAon', name: 'Tesla RWA', price: 220.50, change24h: 2.5, type: 'stock' },
  { symbol: 'QQQon', name: 'Invesco QQQ RWA', price: 405.10, change24h: 1.2, type: 'stock' },
  { symbol: 'NVDAon', name: 'Nvidia RWA', price: 605.30, change24h: 5.4, type: 'stock' },
  { symbol: 'XAU', name: 'Gold', price: 2035.00, change24h: 0.5, type: 'metal' },
  { symbol: 'XAG', name: 'Silver', price: 22.50, change24h: -0.8, type: 'metal' }
];
