import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../routes/app_routes.dart';

class AuthMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) {
    final session = Supabase.instance.client.auth.currentSession;

    // If not logged in & trying to access protected route -> Go to Login
    if (session == null && route != Routes.login) {
      return const RouteSettings(name: Routes.login);
    }

    // If logged in & trying to access Login -> Go to Home
    if (route == Routes.login) {
      return const RouteSettings(name: Routes.home);
    }

    return null; // No redirect needed
  }
}
