import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/services/api';
import {
  debugApiRequest,
  getMockProgressData,
  getMockRecordsData,
  checkServerConnection
} from '../src/utils/apiDebug';
import { useTheme } from '../src/hooks/useTheme';
import { useUser } from '../src/context/userContext';
import { getThemedStyles } from '../src/utils/themeUtils';
import Header from '../components/Header';
import { globalStyles } from '../src/styles/globalStyles';
import { Ionicons } from '@expo/vector-icons';

const ProgressView = () => {
  const { userId } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState({
    monthlyCount: 0,
    weeklyWorkouts: []
  });
  const [recordData, setRecordData] = useState([]);
  const [error, setError] = useState(null);

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    console.log('userId', userId);

    // Check if userId is valid
    if (!userId) {
      setError('User ID is missing or invalid');
      setIsLoading(false);
      return;
    }

    try {
      // First check if server is available
      const isConnected = await checkServerConnection(api);

      if (!isConnected) {
        console.log('Server unavailable, using mock data for testing');
        // Use mock data for development
        setProgressData(getMockProgressData());
        setRecordData(getMockRecordsData().records);
        setIsLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (isLoading) {
          setError('Request timed out');
          setIsLoading(false);
        }
      }, 10000); // 10 second timeout

      const [summaryData, recordsData] = await Promise.all([
        debugApiRequest(api.get, `/api/progress/summary/${userId}`, userId),
        debugApiRequest(api.get, `/api/progress/records/${userId}`, userId)
      ]);

      clearTimeout(timeout);

      // Add data validation
      const validSummaryData = summaryData || {
        monthlyCount: 0,
        weeklyWorkouts: []
      };
      const validRecordsData = recordsData?.records || [];

      // Check if weeklyWorkouts exists and is an array
      if (!Array.isArray(validSummaryData.weeklyWorkouts)) {
        validSummaryData.weeklyWorkouts = [];
      }

      setProgressData(validSummaryData);
      setRecordData(validRecordsData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      // More detailed error message
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error connecting to server';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Calculate maxMinutes safely
  const maxMinutes =
    progressData.weeklyWorkouts && progressData.weeklyWorkouts.length > 0
      ? Math.max(
          ...progressData.weeklyWorkouts.map(w => Number(w.minutes) || 0)
        )
      : 1; // Default to 1 to avoid division by zero

  const WeeklyBar = ({ minutes = 0, day = '', maxHeight = 100 }) => {
    const validMinutes = Number(minutes) || 0;
    const validMaxMinutes = Number(maxMinutes) || 1;

    // If there are no workouts at all, show minimal height bars
    if (validMaxMinutes === 0) {
      return (
        <View style={styles.barContainer}>
          <View style={styles.barLabelContainer}>
            <Text
              style={[styles.barValue, { color: themedStyles.accentColor }]}
            >
              0
            </Text>
          </View>
          <View
            style={[
              styles.bar,
              {
                height: 20,
                width: 30,
                backgroundColor: themedStyles.accentColor,
                opacity: 0.3
              }
            ]}
          />
          <Text style={[styles.dayLabel, { color: themedStyles.textColor }]}>
            {day}
          </Text>
        </View>
      );
    }

    // Calculate bar height as percentage of maximum minutes
    const height = Math.max((validMinutes / validMaxMinutes) * maxHeight, 20);

    return (
      <View style={styles.barContainer}>
        <View style={styles.barLabelContainer}>
          <Text style={[styles.barValue, { color: themedStyles.accentColor }]}>
            {validMinutes}
          </Text>
        </View>
        <View
          style={[
            styles.bar,
            {
              height,
              width: 30,
              backgroundColor: themedStyles.accentColor
            }
          ]}
        />
        <Text style={[styles.dayLabel, { color: themedStyles.textColor }]}>
          {day}
        </Text>
      </View>
    );
  };

  // Add a retry button for better UX when error occurs
  const retryFetch = () => {
    setIsLoading(true);
    setError(null);
    fetchProgressData();
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Progress' />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={themedStyles.accentColor} />
          <Text style={[styles.loadingText, { color: themedStyles.textColor }]}>
            Loading progress data...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Progress' />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themedStyles.textColor }]}>
            Error loading progress data: {error}
          </Text>
          <View style={styles.retryButton}>
            <Ionicons
              name='refresh-outline'
              size={24}
              color={themedStyles.accentColor}
              onPress={retryFetch}
            />
            <Text
              style={[styles.retryText, { color: themedStyles.accentColor }]}
              onPress={retryFetch}
            >
              Retry
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Header pageName='Progress' />

        {/* Monthly Workouts Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name='calendar-outline'
              size={24}
              color={themedStyles.textColor}
            />
            <Text style={[styles.cardTitle, { color: themedStyles.textColor }]}>
              WORKOUTS THIS MONTH
            </Text>
            <Text
              style={[styles.monthlyCount, { color: themedStyles.accentColor }]}
            >
              {progressData.monthlyCount || 0}
            </Text>
          </View>
        </View>

        {/* Weekly Minutes Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name='time-outline'
              size={24}
              color={themedStyles.textColor}
            />
            <Text style={[styles.cardTitle, { color: themedStyles.textColor }]}>
              WORKOUTS THIS WEEK (MINUTES)
            </Text>
          </View>
          {progressData.weeklyWorkouts &&
          progressData.weeklyWorkouts.length > 0 ? (
            <View style={styles.chartContainer}>
              {progressData.weeklyWorkouts.map((workout, index) => (
                <WeeklyBar
                  key={workout.day || index}
                  minutes={workout.minutes || 0}
                  day={workout.day_name || ''}
                  maxHeight={100}
                />
              ))}
            </View>
          ) : (
            <Text
              style={[styles.noDataText, { color: themedStyles.textColor }]}
            >
              No workouts completed yet this week
            </Text>
          )}
        </View>

        {/* Record Breakers Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: themedStyles.secondaryBackgroundColor }
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name='barbell-outline'
              size={24}
              color={themedStyles.textColor}
            />
            <Text style={[styles.cardTitle, { color: themedStyles.textColor }]}>
              RECORD BREAKERS THIS MONTH
            </Text>
          </View>
          {recordData && recordData.length > 0 ? (
            <View style={styles.recordsContainer}>
              {recordData.map((record, index) => (
                <View key={index} style={styles.recordItem}>
                  <Text
                    style={[
                      styles.exerciseName,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    {record.name || 'Exercise'}
                  </Text>
                  <Text
                    style={[
                      styles.recordDetails,
                      { color: themedStyles.textColor }
                    ]}
                  >
                    {record.date
                      ? new Date(record.date).toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Date not available'}
                    {'  '}
                    {record.weight || 0} LBS | {record.reps || 0} REPS
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={[styles.placeholder, { color: themedStyles.textColor }]}
            >
              No records this month
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    paddingBottom: 20
  },
  card: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 15,
    borderRadius: 5
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Lexend',
    marginLeft: 10,
    flex: 1
  },
  monthlyCount: {
    fontSize: 24,
    fontFamily: 'Lexend'
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginTop: 10
  },
  barContainer: {
    alignItems: 'center',
    flex: 1
  },
  barLabelContainer: {
    marginBottom: 5
  },
  barValue: {
    fontSize: 12,
    fontFamily: 'Lexend'
  },
  bar: {
    width: 30,
    borderTopEndRadius: 5,
    borderTopStartRadius: 5
  },
  dayLabel: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'Lexend'
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Lexend',
    marginBottom: 20
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Lexend'
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  retryText: {
    marginLeft: 5,
    fontFamily: 'Lexend'
  },
  placeholder: {
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Lexend',
    fontStyle: 'italic'
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Lexend',
    fontStyle: 'italic'
  },
  recordsContainer: {
    marginTop: 5
  },
  recordItem: {
    marginBottom: 15
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Lexend',
    marginBottom: 5
  },
  recordDetails: {
    fontSize: 14,
    fontFamily: 'Lexend',
    opacity: 0.8
  }
});

export default ProgressView;
