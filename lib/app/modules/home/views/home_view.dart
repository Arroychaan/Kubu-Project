import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/poll_controller.dart';
import 'widgets/poll_card.dart';
import 'widgets/community_poll_item.dart';
import '../../../../core/theme/app_theme.dart';

class HomeView extends GetView<PollController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark background as requested in UI specs
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar / Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'KUBU',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      fontSize: 24,
                      color: Colors.white,
                    ),
                  ),
                  CircleAvatar(
                    backgroundColor: Colors.white10,
                    child: IconButton(
                      icon: const Icon(Icons.person, color: Colors.white),
                      onPressed: () {},
                    ),
                  ),
                ],
              ),
            ),

            // Main Content
            Expanded(
              child: Obx(() {
                if (controller.isLoading.value) {
                  return const Center(child: CircularProgressIndicator());
                }

                return RefreshIndicator(
                  onRefresh: () => controller.fetchPolls(),
                  child: CustomScrollView(
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      // 1. Top Section - Official Daily War
                      SliverToBoxAdapter(
                        child: controller.officialPoll.value != null
                            ? Container(
                                height:
                                    MediaQuery.of(context).size.height * 0.45,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                child: Stack(
                                  children: [
                                    PollCard(
                                      height: double.infinity,
                                      poll: controller.officialPoll.value!,
                                      onVoteA: () => controller.vote(
                                        controller.officialPoll.value!.id,
                                        'a',
                                      ),
                                      onVoteB: () => controller.vote(
                                        controller.officialPoll.value!.id,
                                        'b',
                                      ),
                                    ),
                                    Positioned(
                                      top: 16,
                                      left: 0,
                                      right: 0,
                                      child: Center(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.redAccent,
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.redAccent
                                                    .withValues(alpha: 0.5),
                                                blurRadius: 10,
                                              ),
                                            ],
                                          ),
                                          child: const Text(
                                            'LIVE WAR',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 10,
                                              letterSpacing: 1.2,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : const SizedBox.shrink(),
                      ),

                      // Section Header
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                          child: Text(
                            "COMMUNITY SKIRMISHES",
                            style: TextStyle(
                              color: Colors.white54,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),

                      // 2. Bottom Section - Community Polls
                      SliverList(
                        delegate: SliverChildBuilderDelegate((context, index) {
                          final poll = controller.communityPolls[index];
                          return CommunityPollItem(
                            poll: poll,
                            onVoteA: () => controller.vote(poll.id, 'a'),
                            onVoteB: () => controller.vote(poll.id, 'b'),
                          );
                        }, childCount: controller.communityPolls.length),
                      ),

                      // Padding for FAB
                      const SliverToBoxAdapter(child: SizedBox(height: 100)),
                    ],
                  ),
                );
              }),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.kubuCyan,
        onPressed: () => _showCreatePollDialog(context),
        child: const Icon(Icons.add, color: Colors.black, size: 28),
      ),
    );
  }

  void _showCreatePollDialog(BuildContext context) {
    final questionCtrl = TextEditingController();
    final optACtrl = TextEditingController();
    final optBCtrl = TextEditingController();

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF1E1E1E),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Start a War',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: questionCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Question',
                  labelStyle: TextStyle(color: Colors.white54),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: optACtrl, // Red
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Red Option',
                  labelStyle: TextStyle(color: AppTheme.kubuRed),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.kubuRed),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: optBCtrl, // Cyan
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Cyan Option',
                  labelStyle: TextStyle(color: AppTheme.kubuCyan),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.kubuCyan),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () async {
                    if (questionCtrl.text.isEmpty ||
                        optACtrl.text.isEmpty ||
                        optBCtrl.text.isEmpty) {
                      Get.snackbar('Input Error', 'Fill all fields');
                      return;
                    }
                    final success = await controller.createCommunityPoll(
                      questionCtrl.text,
                      optACtrl.text,
                      optBCtrl.text,
                    );
                    if (success) {
                      Get.back(); // Close sheet
                    }
                  },
                  child: const Text(
                    'DECLARE WAR',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 20), // Keyboard spacing
            ],
          ),
        ),
      ),
      isScrollControlled: true,
    );
  }
}
