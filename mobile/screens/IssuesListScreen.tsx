import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import apiService, { Issue } from '../services/api';

export default function IssuesListScreen() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await apiService.getIssues();
      setIssues(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch issues');
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'HIGH': return '#EF4444';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      infrastructure: '🏗️',
      lighting: '💡',
      safety: '🚨',
      cleanliness: '🧹',
      transportation: '🚦',
      environment: '🌱',
      general: '📝'
    };
    return icons[category] || '📝';
  };

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.priority_level.toLowerCase() === filter;
  });

  const renderIssue = ({ item }: { item: Issue }) => (
    <View style={styles.issueCard}>
      <View style={styles.issueHeader}>
        <Text style={styles.issueTitle}>
          {getCategoryIcon(item.category)} {item.title}
        </Text>
        <View 
          style={[
            styles.priorityBadge, 
            { backgroundColor: getPriorityColor(item.priority_level) }
          ]}
        >
          <Text style={styles.priorityText}>
            {item.priority_level}
          </Text>
        </View>
      </View>
      
      <Text style={styles.issueDescription}>{item.description}</Text>
      
      <View style={styles.issueFooter}>
        <Text style={styles.issueLocation}>📍 {item.location}</Text>
        <Text style={styles.issueScore}>
          AI Score: {item.priority_score.toFixed(1)}/10
        </Text>
      </View>
      
      <View style={styles.issueMeta}>
        <Text style={styles.issueCategory}>
          Category: {item.category} • Sentiment: {item.sentiment}
        </Text>
        <Text style={styles.issueDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All ({issues.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'high' && styles.activeFilter]}
          onPress={() => setFilter('high')}
        >
          <Text style={[styles.filterText, filter === 'high' && styles.activeFilterText]}>
            🔴 High ({issues.filter(i => i.priority_level === 'HIGH').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'medium' && styles.activeFilter]}
          onPress={() => setFilter('medium')}
        >
          <Text style={[styles.filterText, filter === 'medium' && styles.activeFilterText]}>
            🟡 Medium ({issues.filter(i => i.priority_level === 'MEDIUM').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'low' && styles.activeFilter]}
          onPress={() => setFilter('low')}
        >
          <Text style={[styles.filterText, filter === 'low' && styles.activeFilterText]}>
            🟢 Low ({issues.filter(i => i.priority_level === 'LOW').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Issues List */}
      <FlatList
        data={filteredIssues}
        renderItem={renderIssue}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchIssues} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilter: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  listContainer: {
    padding: 15,
  },
  issueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  issueDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueLocation: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  issueScore: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  issueMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueCategory: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  issueDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
