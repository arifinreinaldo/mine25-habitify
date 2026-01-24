import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/widget_data.dart';

/// Supabase API service for widget data
class SupabaseService {
  Supabase? _supabase;
  bool _initialized = false;

  bool get isInitialized => _initialized;

  void _ensureInitialized() {
    if (!_initialized || _supabase == null) {
      throw StateError('SupabaseService not initialized. Call initialize() first.');
    }
  }

  Future<void> initialize(String url, String anonKey) async {
    if (_initialized) return;

    if (url.isEmpty || anonKey.isEmpty) {
      throw ArgumentError('Supabase URL and anon key must not be empty');
    }

    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
    _supabase = Supabase.instance;
    _initialized = true;
  }

  /// Set session from access and refresh tokens (for deep link auth)
  Future<void> setSession(String accessToken, String refreshToken) async {
    _ensureInitialized();
    try {
      // Use refreshSession with the refresh token to get a valid session
      await _supabase!.client.auth.refreshSession(refreshToken);
    } catch (e) {
      print('refreshSession failed: $e');
      rethrow;
    }
  }

  /// Fetch widget data from Supabase
  /// Uses the get_widget_data() RPC function
  Future<WidgetData> fetchWidgetData() async {
    _ensureInitialized();
    try {
      final response = await _supabase!.client.rpc('get_widget_data');
      if (response == null) {
        return WidgetData.empty();
      }
      return WidgetData.fromJson(response as Map<String, dynamic>);
    } catch (e) {
      print('Error fetching widget data: $e');
      rethrow;
    }
  }

  /// Fetch dashboard data (habits + completions)
  Future<Map<String, dynamic>> fetchDashboardData() async {
    _ensureInitialized();
    try {
      final oneYearAgo = DateTime.now().subtract(Duration(days: 365));
      final response = await _supabase!.client.rpc(
        'get_dashboard_data',
        params: {'p_year_ago': oneYearAgo.toString().split(' ')[0]},
      );
      return response as Map<String, dynamic>? ?? {};
    } catch (e) {
      print('Error fetching dashboard data: $e');
      rethrow;
    }
  }

  bool isAuthenticated() {
    if (!_initialized || _supabase == null) return false;
    return _supabase!.client.auth.currentSession != null;
  }

  String? getCurrentUserId() {
    if (!_initialized || _supabase == null) return null;
    return _supabase!.client.auth.currentUser?.id;
  }

  /// Get the Supabase client instance
  SupabaseClient get client {
    _ensureInitialized();
    return _supabase!.client;
  }
}
