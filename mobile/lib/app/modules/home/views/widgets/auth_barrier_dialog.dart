import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../routes/app_routes.dart';
import '../../../auth/controllers/auth_controller.dart';

class AuthBarrierDialog extends StatelessWidget {
  const AuthBarrierDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final authController = Get.find<AuthController>();

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E1E),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Icon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.kubuCyan.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lock_outline_rounded,
              size: 48,
              color: AppTheme.kubuCyan,
            ),
          ),
          const SizedBox(height: 24),

          // Title
          const Text(
            'Login Required',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 12),

          // Subtitle
          const Text(
            'Join the war! You need to be logged in to vote or create polls.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.white70, height: 1.5),
          ),
          const SizedBox(height: 32),

          // Google Login Button
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                // Close dialog first
                Get.back();
                // Then trigger login
                authController.signInWithGoogle();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Placeholder icon using material icons if assets unavailable
                  const Icon(Icons.g_mobiledata, size: 32),
                  const SizedBox(width: 8),
                  const Text(
                    'Continue with Google',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Email Login option
          TextButton(
            onPressed: () {
              Get.back();
              Get.toNamed(Routes.login);
            },
            child: const Text(
              'Or sign in with Email',
              style: TextStyle(
                color: Colors.white54,
                fontSize: 14,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
