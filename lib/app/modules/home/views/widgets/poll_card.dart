import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:get/get.dart';
import 'battle_bar.dart';
import '../../../../data/models/poll_model.dart';
import '../../../../../core/theme/app_theme.dart';

class PollCard extends StatelessWidget {
  final Poll poll;
  final VoidCallback? onVoteA;
  final VoidCallback? onVoteB;

  final double? height;

  const PollCard({
    super.key,
    required this.poll,
    this.onVoteA,
    this.onVoteB,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: height ?? 200,
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Background - Tug of War Visualization (Now via BattleBar)
          BattleBar(
            countA: poll.countA,
            countB: poll.countB,
            colorA: AppTheme.kubuRed.withValues(alpha: 0.8),
            colorB: AppTheme.kubuCyan.withValues(alpha: 0.8),
            height: double.infinity,
            slantAmount: 30, // Make it aggressive
          ),

          // Content Overlay
          Column(
            children: [
              // Header (Question)
              Container(
                padding: const EdgeInsets.all(16),
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.black54, Colors.transparent],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Row(
                  children: [
                    if (poll.isOfficial)
                      const Icon(
                        Icons.verified,
                        color: Colors.yellow,
                        size: 20,
                      ).paddingOnly(right: 8),
                    Expanded(
                      child: Text(
                        poll.question,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          shadows: [
                            const Shadow(color: Colors.black, blurRadius: 4),
                          ],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Options and Vote Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Option A Side
                  Expanded(
                    child: GestureDetector(
                      onTap: onVoteA,
                      child: Container(
                        color: Colors.transparent, // Hit test
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${(poll.percentA * 100).toStringAsFixed(0)}%',
                              style: Theme.of(context).textTheme.displayMedium
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ).animate().scale(),
                            Text(
                              poll.optionA,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: onVoteA,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppTheme.kubuRed,
                                shape: const StadiumBorder(),
                              ),
                              child: const Text('VOTE'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Divider / VS
                  Container(width: 2, height: 80, color: Colors.white30),

                  // Option B Side
                  Expanded(
                    child: GestureDetector(
                      onTap: onVoteB,
                      child: Container(
                        color: Colors.transparent,
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${(poll.percentB * 100).toStringAsFixed(0)}%',
                              style: Theme.of(context).textTheme.displayMedium
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ).animate().scale(),
                            Text(
                              poll.optionB,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.bold),
                              textAlign: TextAlign.end,
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: onVoteB,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppTheme.kubuCyan,
                                shape: const StadiumBorder(),
                              ),
                              child: const Text('VOTE'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
