import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useConfig } from '../src/context/configContext';
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
  const { apiUrl, isLoadingConfig } = useConfig();

  const { state: themeState } = useTheme();
  const themedStyles = getThemedStyles(
    themeState.theme,
    themeState.accentColor
  );

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const [summaryResponse, recordsResponse] = await Promise.all([
        fetch(`${apiUrl,}/api/progress/summary/${userId}`),
        fetch(`${apiUrl,}/api/progress/records/${userId}`)
      ]);

      if (!summaryResponse.ok || !recordsResponse.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const summaryData = await summaryResponse.json();
      const recordsData = await recordsResponse.json();

      setProgressData(summaryData);
      setRecordData(recordsData.records);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };
  const maxMinutes = Math.max(
    ...progressData.weeklyWorkouts.map(w => w.minutes)
  );

  const WeeklyBar = ({ minutes = 0, day = '', maxHeight = 100 }) => {
    // Calculate bar height as percentage of maximum minutes

    // const height = Math.max((minutes / maxMinutes) * maxHeight, 20);

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
                borderRadius: 15,
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
              borderRadius: 15,
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

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: themedStyles.primaryBackgroundColor }
        ]}
      >
        <Header pageName='Progress' />
        <ActivityIndicator size='large' color={themedStyles.accentColor} />
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
        <Text style={[styles.errorText, { color: themedStyles.textColor }]}>
          Error loading progress data
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        globalStyles.container,
        { backgroundColor: themedStyles.primaryBackgroundColor }
      ]}
      contentContainerStyle={styles.contentContainer}
    >
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
            {progressData.monthlyCount}
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
        {progressData.weeklyWorkouts.length > 0 ? (
          <View style={styles.chartContainer}>
            {progressData.weeklyWorkouts.map((workout, index) => (
              <WeeklyBar
                key={workout.day || index}
                minutes={workout.minutes || 0}
                day={workout.day_name || ''}
                maxMinutes={maxMinutes}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.noDataText, { color: themedStyles.textColor }]}>
            No workouts completed yet this week
          </Text>
        )}
      </View>

      {/* Record Breakers Card */}
      <ScrollView
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
        {recordData.length > 0 ? (
          <View style={styles.recordsContainer}>
            {recordData.map((record, index) => (
              <View key={index} style={styles.recordItem}>
                <Text
                  style={[
                    styles.exerciseName,
                    { color: themedStyles.textColor }
                  ]}
                >
                  {record.name}
                </Text>
                <Text
                  style={[
                    styles.recordDetails,
                    { color: themedStyles.textColor }
                  ]}
                >
                  {new Date(record.date).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {'  '}
                  {record.weight} LBS | {record.reps} REPS
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: themedStyles.textColor }]}>
            No records this month
          </Text>
        )}
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
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
    padding: 15
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
    borderRadius: 15
  },
  dayLabel: {
    marginTop: 5,
    fontSize: 12,
    fontFamily: 'Lexend'
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Lexend'
  },
  placeholder: {
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
