import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { ArrowLeft, Database, RefreshCw } from 'lucide-react-native';
import { theme } from '../theme';

export default function DebugDBScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkDatabase = async () => {
    setIsLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      auth: {},
      tables: {},
      errors: []
    };

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.auth = {
        authenticated: !!user,
        userId: user?.id || 'none',
        email: user?.email || 'none',
        error: authError?.message || null
      };

      const tables = [
        'emergency_contacts',
        'sos_alerts',
        'sos_notifications',
        'sos_audio_recordings',
        'location_shares',
        'location_tracks'
      ];

      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: false })
            .limit(1);

          results.tables[table] = {
            exists: !error,
            error: error?.message || null,
            errorCode: error?.code || null,
            errorHint: error?.hint || null,
            count: count || 0,
            sampleData: data?.[0] || null
          };
        } catch (e: any) {
          results.tables[table] = {
            exists: false,
            error: e.message,
            exception: true
          };
        }
      }

      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        results.storage = {
          buckets: buckets?.map(b => b.name) || [],
          error: bucketsError?.message || null
        };
      } catch (e: any) {
        results.storage = {
          error: e.message,
          exception: true
        };
      }

    } catch (e: any) {
      results.errors.push(e.message);
    }

    setStatus(results);
    setIsLoading(false);
  };

  const testInsertContact = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Non autenticato');
        return;
      }

      console.log('Testing insert with user:', user.id);

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_name: 'Test Contact ' + Date.now(),
          contact_phone: '+39 123 456 789',
          priority: 1,
          is_active: true
        })
        .select();

      if (error) {
        alert('Errore: ' + JSON.stringify(error, null, 2));
        console.error('Insert error:', error);
      } else {
        alert('Successo! Contatto aggiunto: ' + JSON.stringify(data, null, 2));
        console.log('Insert success:', data);
      }
    } catch (e: any) {
      alert('Exception: ' + e.message);
      console.error('Exception:', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Database Debug</Text>
        <TouchableOpacity onPress={checkDatabase} disabled={isLoading}>
          <RefreshCw size={24} color={isLoading ? theme.colors.textSecondary : theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!status.timestamp ? (
          <View style={styles.emptyState}>
            <Database size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>Premi il pulsante refresh per verificare lo stato del database</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Authentication</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, status.auth.authenticated ? styles.success : styles.error]}>
                  {status.auth.authenticated ? 'Authenticated ✓' : 'Not Authenticated ✗'}
                </Text>
                <Text style={styles.infoLabel}>User ID:</Text>
                <Text style={styles.infoValue}>{status.auth.userId}</Text>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{status.auth.email}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Database Tables</Text>
              {Object.entries(status.tables || {}).map(([table, info]: [string, any]) => (
                <View key={table} style={styles.tableCard}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableName}>{table}</Text>
                    <Text style={[styles.tableStatus, info.exists ? styles.success : styles.error]}>
                      {info.exists ? '✓' : '✗'}
                    </Text>
                  </View>
                  {info.error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>Error: {info.error}</Text>
                      {info.errorCode && <Text style={styles.errorText}>Code: {info.errorCode}</Text>}
                      {info.errorHint && <Text style={styles.errorText}>Hint: {info.errorHint}</Text>}
                    </View>
                  )}
                  {info.exists && (
                    <Text style={styles.tableInfo}>Records: {info.count}</Text>
                  )}
                </View>
              ))}
            </View>

            {status.storage && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Storage Buckets</Text>
                <View style={styles.infoCard}>
                  {status.storage.error ? (
                    <Text style={styles.errorText}>Error: {status.storage.error}</Text>
                  ) : (
                    status.storage.buckets.map((bucket: string) => (
                      <Text key={bucket} style={styles.infoValue}>• {bucket}</Text>
                    ))
                  )}
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.testButton} onPress={testInsertContact}>
              <Text style={styles.testButtonText}>Test Insert Contact</Text>
            </TouchableOpacity>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Raw Output</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{JSON.stringify(status, null, 2)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  tableCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  tableStatus: {
    fontSize: 18,
    fontWeight: '700',
  },
  tableInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    fontFamily: 'monospace',
  },
  success: {
    color: '#059669',
  },
  error: {
    color: '#EF4444',
  },
  testButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background,
  },
  codeBlock: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  codeText: {
    fontSize: 11,
    color: '#F9FAFB',
    fontFamily: 'monospace',
  },
});
