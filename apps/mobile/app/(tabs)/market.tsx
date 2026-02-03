import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Asset } from '@rwa/shared';

const API_URL = 'http://localhost:3001';

export default function MarketScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/assets`)
      .then(res => res.json())
      .then(data => setAssets(data.assets))
      .catch(err => console.error(err));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market</Text>
      <FlatList
        data={assets}
        keyExtractor={item => item.symbol}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              <View style={[styles.badge, { backgroundColor: item.change24h >= 0 ? '#00C805' : '#FF5000' }]}>
                <Text style={styles.change}>{item.change24h > 0 ? '+' : ''}{item.change24h}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    color: '#666',
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  change: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
