import 'package:flutter/material.dart';

class BattleBar extends StatelessWidget {
  final int countA;
  final int countB;
  final Color colorA;
  final Color colorB;
  final double height;
  final double slantAmount;

  const BattleBar({
    super.key,
    required this.countA,
    required this.countB,
    required this.colorA,
    required this.colorB,
    this.height = 50,
    this.slantAmount = 20,
  });

  @override
  Widget build(BuildContext context) {
    final total = countA + countB;
    // Default to 50% if no votes
    final double targetPercentage = total == 0 ? 0.5 : countA / total;

    return Container(
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(height / 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: TweenAnimationBuilder<double>(
        duration: const Duration(milliseconds: 1000),
        curve: Curves.easeOutCubic,
        tween: Tween<double>(begin: 0.5, end: targetPercentage),
        builder: (context, value, child) {
          return CustomPaint(
            painter: _BattleBarPainter(
              percentage: value,
              colorA: colorA,
              colorB: colorB,
              slant: slantAmount,
            ),
            size: Size.infinite,
          );
        },
      ),
    );
  }
}

class _BattleBarPainter extends CustomPainter {
  final double percentage;
  final Color colorA;
  final Color colorB;
  final double slant;

  _BattleBarPainter({
    required this.percentage,
    required this.colorA,
    required this.colorB,
    required this.slant,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final w = size.width;
    final h = size.height;

    // 1. Draw Background (Option B)
    paint.color = colorB;
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), paint);

    // 2. Draw Option A with Diagonal Slant
    paint.color = colorA;

    // Calculate the "middle" x position based on percentage
    final centerX = w * percentage;

    // To create the slant, we shift the top point right and bottom point left (or vice versa)
    // We want the 'split' to be centered at centerX.

    // Top X coordinate of the split
    final topSplitX = centerX + slant;
    // Bottom X coordinate of the split
    final bottomSplitX = centerX - slant;

    final path = Path();
    path.moveTo(0, 0); // Top Left
    path.lineTo(topSplitX, 0); // Top Split Point
    path.lineTo(bottomSplitX, h); // Bottom Split Point
    path.lineTo(0, h); // Bottom Left
    path.close();

    canvas.drawPath(path, paint);

    // Optional: Draw a "divider" line for extra pop?
    // Let's keep it clean for now, just the two colors clashing.

    // 3. Draw a white divider line
    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.8)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final linePath = Path();
    linePath.moveTo(topSplitX, 0);
    linePath.lineTo(bottomSplitX, h);
    canvas.drawPath(linePath, linePaint);
  }

  @override
  bool shouldRepaint(covariant _BattleBarPainter oldDelegate) {
    return oldDelegate.percentage != percentage ||
        oldDelegate.colorA != colorA ||
        oldDelegate.colorB != colorB;
  }
}
