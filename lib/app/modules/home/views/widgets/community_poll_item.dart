import 'package:flutter/material.dart';
import '../../../../data/models/poll_model.dart';
import '../../../../../core/theme/app_theme.dart';
import 'battle_bar.dart';

class CommunityPollItem extends StatelessWidget {
  final Poll poll;
  final VoidCallback? onVoteA;
  final VoidCallback? onVoteB;

  const CommunityPollItem({
    super.key,
    required this.poll,
    this.onVoteA,
    this.onVoteB,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User Info & Question
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: Colors.grey[800],
                child: const Icon(Icons.person, size: 16, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Anonymous User', // Placeholder since join isn't implemented
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.white54),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      poll.question,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Battle Bar with Percentages
          GestureDetector(
            onTapUp: (details) {
              // Basic hit testing for A vs B
              final width = context.size?.width ?? 1;
              final dx = details.localPosition.dx;
              if (dx < width / 2) {
                onVoteA?.call();
              } else {
                onVoteB?.call();
              }
            },
            child: SizedBox(
              height: 24,
              child: Stack(
                children: [
                  BattleBar(
                    countA: poll.countA,
                    countB: poll.countB,
                    colorA: AppTheme.kubuRed,
                    colorB: AppTheme.kubuCyan,
                    height: 24,
                    slantAmount: 10,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Text(
                          poll.optionA,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Text(
                          poll.optionB,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${(poll.percentA * 100).toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.bolt, size: 12, color: Colors.white30),
                        const SizedBox(width: 4),
                        Text(
                          '${(poll.percentB * 100).toStringAsFixed(0)}%',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action Buttons
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: onVoteA,
                child: Text(
                  'VOTE ${poll.optionA.toUpperCase()}',
                  style: const TextStyle(fontSize: 10, color: AppTheme.kubuRed),
                ),
              ),
              TextButton(
                onPressed: onVoteB,
                child: Text(
                  'VOTE ${poll.optionB.toUpperCase()}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.kubuCyan,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
