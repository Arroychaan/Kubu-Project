import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../data/models/profile_model.dart';
import 'dart:developer';

import '../views/login_view.dart';

class AuthController extends GetxController {
  SupabaseClient get _supabase => Supabase.instance.client;
  final Rxn<User> user = Rxn<User>();
  final Rxn<Profile> profile = Rxn<Profile>();

  // UI State
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final isPasswordHidden = true.obs;
  final isLoading = false.obs;

  // Toggles between Login (true) and Register (false) mode
  final isLoginMode = true.obs;

  @override
  void onInit() {
    super.onInit();

    // Delay to ensure Supabase is initialized
    Future.delayed(const Duration(milliseconds: 100), () {
      try {
        // Listen to auth state changes
        _supabase.auth.onAuthStateChange.listen((data) {
          final session = data.session;
          user.value = session?.user;

          if (user.value != null) {
            initializeProfile();
            // Safe Navigation: Only redirect if explicitly on login screen
            // or if we need to force Home
            if (Get.currentRoute == '/login' || Get.currentRoute == '/auth') {
              Get.offAllNamed('/home');
            }
          } else {
            // Safe Navigation: Only redirect to login if we are not already there
            if (Get.currentRoute != '/login') {
              Get.offAllNamed('/login');
            }
          }
        });

        // No explicit manual check needed here because the listener above
        // fires immediately with current session on subscription.
      } catch (e) {
        log('Supabase not initialized. Running in offline mode.');
      }
    });
  }

  void togglePasswordVisibility() {
    isPasswordHidden.value = !isPasswordHidden.value;
  }

  void toggleAuthMode() {
    isLoginMode.value = !isLoginMode.value;
    // Reset fields is optional
  }

  // Unified Auth Action
  Future<void> basicAuth() async {
    if (isLoginMode.value) {
      await login();
    } else {
      await signUp();
    }
  }

  Future<void> login() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter email and password',
        colorText: Colors.white,
        backgroundColor: Colors.red,
      );
      return;
    }

    isLoading.value = true;
    try {
      await _supabase.auth.signInWithPassword(
        email: emailController.text,
        password: passwordController.text,
      );
    } on AuthException catch (e) {
      Get.snackbar(
        'Login Failed',
        e.message,
        colorText: Colors.white,
        backgroundColor: Colors.red,
      );
    } catch (e) {
      Get.snackbar(
        'Error',
        'Unexpected error occurred',
        colorText: Colors.white,
        backgroundColor: Colors.red,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> signUp() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Please enter email and password',
        colorText: Colors.white,
        backgroundColor: Colors.red,
      );
      return;
    }

    isLoading.value = true;
    try {
      await _supabase.auth.signUp(
        email: emailController.text,
        password: passwordController.text,
      );
      Get.snackbar(
        'Success',
        'Account created! Please check your email (if verification enabled) or login.',
        colorText: Colors.white,
        backgroundColor: Colors.green,
      );
      // Depending on Supabase settings, auto-login might happen or not.
      // If email confirm is off, it auto logs in.
    } on AuthException catch (e) {
      Get.snackbar(
        'Sign Up Failed',
        e.message,
        colorText: Colors.white,
        backgroundColor: Colors.red,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
    Get.offAll(() => const LoginView());
  }

  Future<void> initializeProfile() async {
    if (user.value == null) return;
    try {
      final userId = user.value!.id;
      final data = await _supabase
          .from('profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (data == null) {
        final newProfile = Profile(
          id: userId,
          username: emailController.text.isNotEmpty
              ? emailController.text.split('@').first
              : 'User_${userId.substring(0, 4)}',
        );
        await _supabase.from('profiles').insert(newProfile.toJson());
        profile.value = newProfile;
      } else {
        profile.value = Profile.fromJson(data);
      }
    } catch (e) {
      log('Profile Init Error: $e');
    }
  }

  Future<void> signInWithGoogle() async {
    try {
      await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.kubu://login-callback',
      );
    } catch (e) {
      Get.snackbar(
        'Google Sign In Failed',
        e.toString(),
        colorText: Colors.white,
        backgroundColor: Colors.red,
      );
    }
  }
}
