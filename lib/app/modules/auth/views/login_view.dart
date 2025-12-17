import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../../core/theme/app_theme.dart';
import '../controllers/auth_controller.dart';

class LoginView extends GetView<AuthController> {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    // Determine screen size for responsiveness
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFF050505), // Very dark background
      body: SingleChildScrollView(
        child: SizedBox(
          height: size.height,
          width: size.width,
          child: Stack(
            children: [
              // Background subtle gradient/glow
              Positioned(
                top: -100,
                right: -100,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppTheme.kubuCyan.withValues(alpha: 0.1),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(flex: 2),

                    // LOGO WITH GLITCH EFFECT
                    const GlitchText(
                      text: "KUBU",
                      fontSize: 48,
                      letterSpacing: 8,
                    ),
                    const SizedBox(height: 8),
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                        children: [
                          const TextSpan(text: "Voice Your "),
                          TextSpan(
                            text: "Vote.",
                            style: TextStyle(
                              color: AppTheme.kubuCyan,
                              fontWeight: FontWeight.bold,
                              shadows: [
                                BoxShadow(
                                  color: AppTheme.kubuCyan.withValues(
                                    alpha: 0.5,
                                  ),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 48),

                    // ID // USERNAME FIELD
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "ID // USERNAME",
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildTextField(
                      controller: controller.emailController,
                      hint: "Enter ID or Email",
                      icon: Icons.person_rounded,
                      obscure: false,
                    ),

                    const SizedBox(height: 24),

                    // PASSWORD FIELD
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "PASSWORD",
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Obx(
                      () => _buildTextField(
                        controller: controller.passwordController,
                        hint: "••••••••",
                        icon: Icons.lock_rounded,
                        obscure: controller.isPasswordHidden.value,
                        suffixIcon: IconButton(
                          icon: Icon(
                            controller.isPasswordHidden.value
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: Colors.grey,
                            size: 18,
                          ),
                          onPressed: () =>
                              controller.togglePasswordVisibility(),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // FORGOT PASSWORD
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "FORGOT PASSWORD?",
                        style: TextStyle(
                          color: AppTheme.kubuRed,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                          shadows: [
                            BoxShadow(
                              color: AppTheme.kubuRed.withValues(alpha: 0.3),
                              blurRadius: 5,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // AUTH BUTTON (Dynamic Login/Register)
                    Obx(
                      () => Container(
                        width: double.infinity,
                        height: 50,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          gradient: const LinearGradient(
                            colors: [AppTheme.kubuCyan, Color(0xFF00BFA5)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.kubuCyan.withValues(alpha: 0.4),
                              blurRadius: 15,
                              spreadRadius: 1,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: controller.isLoading.value
                              ? null
                              : () => controller.basicAuth(),
                          child: controller.isLoading.value
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.black,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  controller.isLoginMode.value
                                      ? "INITIALISE LOGIN"
                                      : "INITIALISE REGISTRATION",
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.0,
                                    fontSize: 14,
                                  ),
                                ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // DIVIDER
                    Row(
                      children: [
                        Expanded(child: Divider(color: Colors.grey[800])),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            "0101 OR 0101",
                            style: TextStyle(
                              color: AppTheme.kubuCyan.withValues(alpha: 0.3),
                              fontFamily: 'Courier',
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: Colors.grey[800])),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // SOCIAL BUTTONS
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildSocialButton(Icons.facebook),
                        const SizedBox(width: 24),
                        _buildSocialButton(
                          Icons.g_mobiledata_rounded,
                          isGoogle: true,
                        ),
                        const SizedBox(width: 24),
                        _buildSocialButton(Icons.apple),
                      ],
                    ),

                    const Spacer(flex: 3),

                    // CREATE ACCOUNT TOGGLE
                    Obx(
                      () => Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            controller.isLoginMode.value
                                ? "New to the grid? "
                                : "Already have ID? ",
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => controller.toggleAuthMode(),
                            child: Text(
                              controller.isLoginMode.value
                                  ? "Create Account"
                                  : "Access Logic",
                              style: const TextStyle(
                                color: AppTheme.kubuCyan,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscure = false,
    Widget? suffixIcon,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF131619), // Dark card background
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2D3339)), // Subtle border
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(color: Colors.grey[600], fontSize: 13),
          prefixIcon: Icon(icon, color: Colors.grey[600], size: 20),
          suffixIcon: suffixIcon,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButton(IconData icon, {bool isGoogle = false}) {
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: const Color(0xFF131619),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFF2D3339)),
      ),
      child: Center(
        child: Icon(icon, color: Colors.white, size: isGoogle ? 28 : 22),
      ),
    );
  }
}

class GlitchText extends StatelessWidget {
  final String text;
  final double fontSize;
  final double letterSpacing;

  const GlitchText({
    super.key,
    required this.text,
    required this.fontSize,
    required this.letterSpacing,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Cyan Offset
        Transform.translate(
          offset: const Offset(-2, 0),
          child: Text(
            text,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w900,
              letterSpacing: letterSpacing,
              color: AppTheme.kubuCyan.withValues(alpha: 0.5),
              fontFamily: 'Courier',
            ),
          ),
        ),
        // Red Offset
        Transform.translate(
          offset: const Offset(2, 0),
          child: Text(
            text,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w900,
              letterSpacing: letterSpacing,
              color: AppTheme.kubuRed.withValues(alpha: 0.5),
              fontFamily: 'Courier',
            ),
          ),
        ),
        // Main Text (White)
        Text(
          text,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w900,
            letterSpacing: letterSpacing,
            color: Colors.white,
            fontFamily: 'Courier',
          ),
        ),
      ],
    );
  }
}
