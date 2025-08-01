import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiService, { Issue } from '../services/api';
import { RootStackParamList } from '../App';

// Define stats interface to avoid 'any' type
interface Stats {
  total_issues: number;
  priority_distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  categories: Array<{category: string, count: number}>;
  average_priority_score: number;
  ai_status: string;
}

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [issuesData, statsData] = await Promise.all([
        apiService.getIssues(),
        apiService.getStats(),
      ]);
      
      // Get only recent issues for home screen
      setIssues(issuesData.slice(0, 5));
      setStats(statsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data. Please check your connection.');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPriorityColor = (level: string): string => {
    switch (level) {
      case 'HIGH': return '#EF4444';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string): string => {
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to UrbanSage</Text>
        <Text style={styles.headerSubtitle}>Report city issues with AI-powered analysis</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total_issues}</Text>
            <Text style={styles.statLabel}>Total Issues</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statNumber, { color: '#DC2626' }]}>
              {stats.priority_distribution.HIGH}
            </Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>
              {stats.priority_distribution.MEDIUM}
            </Text>
            <Text style={styles.statLabel}>Medium Priority</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>
              {stats.priority_distribution.LOW}
            </Text>
            <Text style={styles.statLabel}>Low Priority</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.primaryButtonText}>📸 Report New Issue</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('IssuesList')}
        >
          <Text style={styles.secondaryButtonText}>📋 View All Issues</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Issues */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Issues</Text>
        {issues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No issues reported yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to report an issue!</Text>
          </View>
        ) : (
          issues.map((issue) => (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueTitle}>
                  {getCategoryIcon(issue.category)} {issue.title}
                </Text>
                <View 
                  style={[
                    styles.priorityBadge, 
                    { backgroundColor: getPriorityColor(issue.priority_level) }
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {issue.priority_level} ({issue.priority_score.toFixed(1)})
                  </Text>
                </View>
              </View>
              <Text style={styles.issueDescription} numberOfLines={2}>
                {issue.description}
              </Text>
              <Text style={styles.issueLocation}>📍 {issue.location}</Text>
              <Text style={styles.issueDate}>
                {new Date(issue.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  actionButtons: {
    padding: 15,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
  issueCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
    marginBottom: 8,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  issueDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  issueLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  issueDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});