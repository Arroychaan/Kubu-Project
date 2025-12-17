import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color kubuRed = Color(0xFFFF3B30);
  static const Color kubuCyan = Color(0xFF5AC8FA);
  static const Color background = Color(0xFF0D0D0D);
  static const Color surface = Color(0xFF1C1C1E);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: kubuRed,
      colorScheme: const ColorScheme.dark(
        primary: kubuRed,
        secondary: kubuCyan,
        surface: surface,
        // background: background, // Deprecated, inferred from brightness or surface
      ),
      textTheme: GoogleFonts.outfitTextTheme(
        ThemeData.dark().textTheme,
      ).apply(bodyColor: Colors.white, displayColor: Colors.white),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: true,
      ),
      cardColor: surface,
    );
  }
}
