import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SUPPORTED_ASSETS } from '@rwa/shared';

const server = Fastify({ logger: true });

server.register(cors, {
  origin: '*'
});

// Mock Database
let userBalance = 10000.00; // 10,000 USDT
const portfolio: Record<string, number> = {};

server.get('/assets', async () => {
  return { assets: SUPPORTED_ASSETS };
});

server.get('/balance', async () => {
  return { 
    usdt: userBalance,
    portfolio
  };
});

server.post('/trade', async (request, reply) => {
  const { symbol, amount, action } = request.body as any;
  const asset = SUPPORTED_ASSETS.find(a => a.symbol === symbol);
  
  if (!asset) {
    return reply.code(400).send({ error: 'Invalid asset' });
  }

  const cost = asset.price * amount;

  if (action === 'buy') {
    if (userBalance < cost) {
      return reply.code(400).send({ error: 'Insufficient funds' });
    }
    userBalance -= cost;
    portfolio[symbol] = (portfolio[symbol] || 0) + amount;
  } else if (action === 'sell') {
    if (!portfolio[symbol] || portfolio[symbol] < amount) {
      return reply.code(400).send({ error: 'Insufficient holdings' });
    }
    userBalance += cost;
    portfolio[symbol] -= amount;
  }

  return { success: true, newBalance: userBalance, portfolio };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
