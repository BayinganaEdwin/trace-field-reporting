import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { EmptyState } from '../../components/layout/EmptyState';
import { ReportCard } from '../../components/report/ReportCard';
import { useReports } from '../../hooks/useReports';
import { MOCK_WORKER } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { WorkerStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

export function WorkerHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, loading, refresh } = useReports();

  const myReports = reports.filter((r) => r.submittedById === MOCK_WORKER.id);

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      {myReports.length === 0 && !loading ? (
        <EmptyState
          title="No reports yet"
          subtitle="Your submitted reports will appear here."
        />
      ) : (
        myReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onPress={() =>
              navigation.navigate('WorkerReportDetail', { reportId: report.id })
            }
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing[12],
  },
});
