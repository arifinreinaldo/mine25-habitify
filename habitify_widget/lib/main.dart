import 'dart:async';
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:workmanager/workmanager.dart';
import 'package:home_widget/home_widget.dart';
import 'services/supabase_service.dart';
import 'services/widget_service.dart';

// Supabase configuration - replace with your actual values
const supabaseUrl = String.fromEnvironment('SUPABASE_URL', defaultValue: '');
const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

// WorkManager task name
const widgetUpdateTask = 'habitify_widget_update';

/// WorkManager callback dispatcher - runs in background isolate
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    if (taskName == widgetUpdateTask) {
      try {
        // Initialize Supabase in background
        final supabaseService = SupabaseService();
        await supabaseService.initialize(supabaseUrl, supabaseAnonKey);

        // Try to restore session from secure storage
        const storage = FlutterSecureStorage();
        final accessToken = await storage.read(key: 'access_token');
        final refreshToken = await storage.read(key: 'refresh_token');

        if (accessToken != null && refreshToken != null) {
          await supabaseService.setSession(accessToken, refreshToken);

          if (supabaseService.isAuthenticated()) {
            // Fetch and update widget data
            final data = await supabaseService.fetchWidgetData();
            await WidgetService.updateWidget(data);
          }
        }
        return true;
      } catch (e) {
        print('WorkManager task error: $e');
        return false;
      }
    }
    return true;
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize WorkManager for background updates
  await Workmanager().initialize(callbackDispatcher, isInDebugMode: false);

  // Schedule periodic widget updates (every 15 minutes)
  await Workmanager().registerPeriodicTask(
    widgetUpdateTask,
    widgetUpdateTask,
    frequency: const Duration(minutes: 15),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );

  runApp(const HabitifyWidgetApp());
}

class HabitifyWidgetApp extends StatelessWidget {
  const HabitifyWidgetApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Habitify Widget',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _statusMessage;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initializeApp() async {
    try {
      // Initialize Supabase
      if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
        await _supabaseService.initialize(supabaseUrl, supabaseAnonKey);
      }

      // Set up deep link handling
      _appLinks = AppLinks();

      // Check if app was opened via deep link
      final initialLink = await _appLinks.getInitialLink();
      if (initialLink != null) {
        await _handleDeepLink(initialLink);
      }

      // Listen for incoming deep links while app is running
      _linkSubscription = _appLinks.uriLinkStream.listen(
        _handleDeepLink,
        onError: (e) {
          print('Deep link error: $e');
        },
      );

      // Try to restore existing session
      await _restoreSession();
    } catch (e) {
      setState(() {
        _errorMessage = 'Initialization error: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDeepLink(Uri uri) async {
    print('Received deep link: $uri');

    if (uri.scheme == 'habitify' && uri.host == 'auth') {
      setState(() {
        _isLoading = true;
        _statusMessage = 'Authenticating...';
        _errorMessage = null;
      });

      try {
        final accessToken = uri.queryParameters['access_token'];
        final refreshToken = uri.queryParameters['refresh_token'];

        if (accessToken == null || refreshToken == null) {
          throw Exception('Missing tokens in deep link');
        }

        // Store tokens securely
        await _secureStorage.write(key: 'access_token', value: accessToken);
        await _secureStorage.write(key: 'refresh_token', value: refreshToken);

        // Set Supabase session
        await _supabaseService.setSession(accessToken, refreshToken);

        // Verify authentication
        if (_supabaseService.isAuthenticated()) {
          setState(() {
            _isAuthenticated = true;
            _statusMessage = 'Connected! Fetching data...';
          });

          // Fetch and update widget
          await _fetchAndUpdateWidget();

          setState(() {
            _statusMessage = 'Widget updated successfully!';
          });
        } else {
          throw Exception('Failed to authenticate');
        }
      } catch (e) {
        setState(() {
          _errorMessage = 'Authentication failed: $e';
          _statusMessage = null;
        });
      } finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _restoreSession() async {
    try {
      final accessToken = await _secureStorage.read(key: 'access_token');
      final refreshToken = await _secureStorage.read(key: 'refresh_token');

      if (accessToken != null && refreshToken != null) {
        await _supabaseService.setSession(accessToken, refreshToken);

        if (_supabaseService.isAuthenticated()) {
          setState(() {
            _isAuthenticated = true;
          });
        }
      }
    } catch (e) {
      print('Session restore error: $e');
    }
  }

  Future<void> _fetchAndUpdateWidget() async {
    try {
      final data = await _supabaseService.fetchWidgetData();
      await WidgetService.updateWidget(data);
    } catch (e) {
      print('Widget update error: $e');
      rethrow;
    }
  }

  Future<void> _refreshWidget() async {
    setState(() {
      _isLoading = true;
      _statusMessage = 'Refreshing widget...';
      _errorMessage = null;
    });

    try {
      await _fetchAndUpdateWidget();
      setState(() {
        _statusMessage = 'Widget refreshed!';
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Refresh failed: $e';
        _statusMessage = null;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _logout() async {
    await _secureStorage.deleteAll();
    setState(() {
      _isAuthenticated = false;
      _statusMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Habitify Widget Setup'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Status icon
              Icon(
                _isAuthenticated ? Icons.check_circle : Icons.link,
                size: 80,
                color: _isAuthenticated ? Colors.green : Colors.grey,
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                _isAuthenticated ? 'Widget Connected!' : 'Connect Your Widget',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Instructions
              Text(
                _isAuthenticated
                    ? 'Your widget is syncing with Habitify.\nAdd it to your home screen!'
                    : 'Open Habitify in your browser and tap\n"Connect Android Widget" in Settings.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Loading indicator
              if (_isLoading) ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
              ],

              // Status message
              if (_statusMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _statusMessage!,
                    style: TextStyle(color: Colors.green[700]),
                  ),
                ),

              // Error message
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red[700]),
                  ),
                ),

              const SizedBox(height: 32),

              // Actions
              if (_isAuthenticated && !_isLoading) ...[
                ElevatedButton.icon(
                  onPressed: _refreshWidget,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh Widget'),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _logout,
                  child: const Text('Disconnect'),
                ),
              ],

              const Spacer(),

              // Help text
              Text(
                'Widget updates automatically every 15 minutes',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[400],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
