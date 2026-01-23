import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/widget_data.dart';

/// Supabase API service for widget data
class SupabaseService {
  late final Supabase _supabase;

  Future<void> initialize(String url, String anonKey) async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
    _supabase = Supabase.instance;
  }

  /// Fetch widget data from Supabase
  /// Uses the get_widget_data() RPC function
  Future<WidgetData> fetchWidgetData(String userId, String accessToken) async {
    try {
      final response = await _supabase.client.rpc('get_widget_data').execute();
      return WidgetData.fromJson(response);
    } catch (e) {
      print('Error fetching widget data: $e');
      rethrow;
    }
  }

  /// Fetch dashboard data (habits + completions)
  Future<Map<String, dynamic>> fetchDashboardData(String accessToken) async {
    try {
      final oneYearAgo = DateTime.now().subtract(Duration(days: 365));
      final response = await _supabase.client.rpc(
        'get_dashboard_data',
        params: {'p_year_ago': oneYearAgo.toString().split(' ')[0]},
      ).execute();
      return response;
    } catch (e) {
      print('Error fetching dashboard data: $e');
      rethrow;
    }
  }

  bool isAuthenticated() {
    return _supabase.auth.currentSession != null;
  }

  String? getCurrentUserId() {
    return _supabase.auth.currentUser?.id;
  }
}
