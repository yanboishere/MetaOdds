import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001';

export default function PortfolioScreen() {
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/balance`)
      .then(res => res.json())
      .then(data => setBalance(data))
      .catch(err => console.error(err));
  }, []);

  if (!balance) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Investing</Text>
        <Text style={styles.balance}>${balance.usdt.toLocaleString()}</Text>
      </View>
      
      <ScrollView style={styles.holdings}>
        <Text style={styles.sectionTitle}>Stocks & RWA</Text>
        {Object.entries(balance.portfolio).map(([symbol, amount]: [string, any]) => (
          <View key={symbol} style={styles.row}>
            <Text style={styles.symbol}>{symbol}</Text>
            <Text style={styles.amount}>{amount} Shares</Text>
          </View>
        ))}
        {Object.keys(balance.portfolio).length === 0 && (
          <Text style={styles.empty}>No assets owned yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  holdings: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    color: '#666',
  },
  empty: {
    color: '#999',
    marginTop: 20,
  },
});
