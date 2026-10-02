import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Typography } from '../ui/Typography';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
  label: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  WorkerHome:           { activeIcon: 'home',          inactiveIcon: 'home-outline',          label: 'Home'     },
  WorkerHistory:        { activeIcon: 'document-text', inactiveIcon: 'document-text-outline', label: 'Reports'  },
  WorkerProfile:        { activeIcon: 'person',        inactiveIcon: 'person-outline',        label: 'Profile'  },
  ManagerHome:          { activeIcon: 'bar-chart',     inactiveIcon: 'bar-chart-outline',     label: 'Overview' },
  ReportsFeed:          { activeIcon: 'documents',     inactiveIcon: 'documents-outline',     label: 'Reports'  },
  ManagerNotifications: { activeIcon: 'notifications', inactiveIcon: 'notifications-outline', label: 'Alerts'   },
  ManagerProfile:       { activeIcon: 'person',        inactiveIcon: 'person-outline',        label: 'Profile'  },
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            activeIcon: 'ellipse', inactiveIcon: 'ellipse-outline', label: route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.selectionAsync();
              navigation.navigate(route.name);
            }
          };

          // Active: filled navy pill + white icon — high contrast, intentional
          // Inactive: transparent + warm gray icon
          const iconColor = isFocused ? colors.textInverse : colors.tabBarInactive;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={isFocused ? config.activeIcon : config.inactiveIcon}
                  size={21}
                  color={iconColor}
                />
              </View>
              <Typography
                variant="overline"
                color={isFocused ? colors.tabBarActive : colors.tabBarInactive}
                style={styles.label}
              >
                {config.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    backgroundColor: 'transparent',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    // Crisp shadow — floats without being heavy
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing[1],
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  // Filled accent pill — the defining active-state treatment
  iconWrapActive: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    width: 44,
    height: 32,
  },
  label: {
    letterSpacing: 0.3,
  },
});
