import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../data/models/poll_model.dart';
import '../../auth/controllers/auth_controller.dart';
import '../views/widgets/auth_barrier_dialog.dart';

class PollController extends GetxController {
  SupabaseClient get _supabase => Supabase.instance.client;

  // Observables
  final officialPoll = Rxn<Poll>();
  final communityPolls = <Poll>[].obs;
  final isLoading = true.obs;

  // Realtime Subscription
  RealtimeChannel? _voteSubscription;

  @override
  void onInit() {
    super.onInit();
    fetchPolls();
    _subscribeToVotes();
  }

  @override
  void onClose() {
    _voteSubscription?.unsubscribe();
    super.onClose();
  }

  // Master fetch
  Future<void> fetchPolls() async {
    isLoading.value = true;
    try {
      await Future.wait([fetchOfficialPoll(), fetchCommunityPolls()]);
    } catch (e) {
      Get.snackbar('Error', 'Failed to load polls: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchOfficialPoll() async {
    try {
      // 1. Fetch the Poll
      final response = await _supabase
          .from('polls')
          .select()
          .eq('is_official', true)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response == null) {
        officialPoll.value = null;
        return;
      }

      // 2. Fetch Stats Manually (Safest approach for Views without explicit FKs)
      final pollData = Map<String, dynamic>.from(response);
      final stats = await _supabase
          .from('poll_stats')
          .select()
          .eq('poll_id', pollData['id'])
          .maybeSingle();

      if (stats != null) {
        pollData['poll_stats'] = stats;
      }

      officialPoll.value = Poll.fromJson(pollData);
    } catch (e) {
      Get.log('Fetch Official Poll Error: $e');
    }

    // FALLBACK MOCK DATA
    if (officialPoll.value == null) {
      officialPoll.value = Poll(
        id: 'mock_official',
        question: 'Soto Betawi vs Soto Lamongan?',
        optionA: 'Betawi',
        optionB: 'Lamongan',
        isOfficial: true,
        createdAt: DateTime.now(),
        countA: 1500,
        countB: 890,
        creatorId: 'official',
      );
    }
  }

  Future<void> fetchCommunityPolls() async {
    try {
      // 1. Fetch Polls
      final response = await _supabase
          .from('polls')
          .select()
          .eq('is_official', false)
          .order('created_at', ascending: false)
          .limit(20);

      final List<dynamic> data = response;
      if (data.isEmpty) {
        communityPolls.clear();
        return;
      }

      // 2. Fetch Stats for these polls
      final pollIds = data.map((e) => e['id']).toList();
      final statsResponse = await _supabase
          .from('poll_stats')
          .select()
          .inFilter('poll_id', pollIds);

      final List<dynamic> statsData = statsResponse;
      final statsMap = {for (var s in statsData) s['poll_id']: s};

      // 3. Merge
      communityPolls.value = data.map((p) {
        final Map<String, dynamic> pollMap = Map<String, dynamic>.from(p);
        final stat = statsMap[p['id']];
        if (stat != null) {
          pollMap['poll_stats'] = stat;
        }
        // Force calculation of percentages in model
        return Poll.fromJson(pollMap);
      }).toList();
    } catch (e) {
      Get.log('Fetch Community Polls Error: $e');
    }

    // FALLBACK MOCK DATA (For UI Showcase if DB is empty/RLS blocks)
    if (communityPolls.isEmpty) {
      communityPolls.value = [
        Poll(
          id: 'mock_1',
          question: 'Bubur Diaduk vs Tidak Diaduk?',
          optionA: 'Tim Diaduk',
          optionB: 'Tim Pisah',
          isOfficial: false,
          createdAt: DateTime.now(),
          countA: 45,
          countB: 32,
          creatorId: 'mock',
        ),
        Poll(
          id: 'mock_2',
          question: 'Android vs iOS?',
          optionA: 'Android',
          optionB: 'iOS',
          isOfficial: false,
          createdAt: DateTime.now(),
          countA: 120,
          countB: 150,
          creatorId: 'mock',
        ),
      ];
    }
  }

  // Note: 'a' or 'b'
  void vote(String pollId, String choice) async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      Get.bottomSheet(const AuthBarrierDialog(), isScrollControlled: true);
      return;
    }

    // Optimistic Update
    _optimisticUpdate(pollId, choice);

    try {
      await _supabase.from('votes').insert({
        'poll_id': pollId,
        'user_id': user.id,
        'choice': choice,
      });
      // Realtime subscription will likely confirm this,
      // but we can also re-fetch individual stats if needed.
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        Get.snackbar(
          'Halt!',
          'You already voted in this war!',
          backgroundColor: Colors.red,
          colorText: Colors.white,
        );
        // Revert optimistic update?
        // For simple MVP, we might just re-fetch to correct state.
        fetchOfficialPoll();
        fetchCommunityPolls();
      } else {
        Get.snackbar('Error', 'Vote failed: ${e.message}');
      }
    } catch (e) {
      Get.snackbar('Error', 'Unexpected error: $e');
    }
  }

  void _optimisticUpdate(String pollId, String choice) {
    // Helper to increment counts locally
    // Check Official
    if (officialPoll.value?.id == pollId) {
      final current = officialPoll.value!;
      officialPoll.value = Poll(
        id: current.id,
        question: current.question,
        optionA: current.optionA,
        optionB: current.optionB,
        isOfficial: current.isOfficial,
        createdAt: current.createdAt,
        countA: choice == 'a' ? current.countA + 1 : current.countA,
        countB: choice == 'b' ? current.countB + 1 : current.countB,
        creatorId: current.creatorId,
      );
    }
    // Check Community
    else {
      final index = communityPolls.indexWhere((p) => p.id == pollId);
      if (index != -1) {
        final current = communityPolls[index];
        communityPolls[index] = Poll(
          id: current.id,
          question: current.question,
          optionA: current.optionA,
          optionB: current.optionB,
          isOfficial: current.isOfficial,
          createdAt: current.createdAt,
          countA: choice == 'a' ? current.countA + 1 : current.countA,
          countB: choice == 'b' ? current.countB + 1 : current.countB,
          creatorId: current.creatorId,
        );
      }
    }
  }

  void _subscribeToVotes() {
    // Listen to INSERTs on the votes table
    _voteSubscription = _supabase
        .channel('public:votes')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'votes',
          callback: (payload) {
            handleRealtimeVote(payload.newRecord);
          },
        )
        .subscribe();
  }

  void handleRealtimeVote(Map<String, dynamic> newVote) {
    final pollId = newVote['poll_id'];
    final choice = newVote['choice']; // 'a' or 'b'
    final userId = newVote['user_id'];

    // Don't double count our own vote if we already optimistically updated it
    // Logic: If userId == currentUser.id, we ignore?
    // Yes, because our optimistic update dealt with it.
    if (userId == _supabase.auth.currentUser?.id) return;

    // Apply update
    _optimisticUpdate(pollId, choice);
  }

  Future<bool> createCommunityPoll(
    String question,
    String optA,
    String optB,
  ) async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      Get.bottomSheet(const AuthBarrierDialog(), isScrollControlled: true);
      return false;
    }

    // 1. Check Limits (Anti-Spam)
    try {
      // Refresh profile to be safe
      final authController = Get.find<AuthController>();
      await authController.initializeProfile();
      final profile = authController.profile.value;

      if (profile == null) {
        Get.snackbar('Error', 'Could not load profile.');
        return false;
      }

      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      int currentCount = profile.dailyPostCount;

      // Reset if new day
      if (profile.lastPostDate != today) {
        currentCount = 0;
        // Optimization: We could update DB now, or just let the final update handle it.
        // Let's trust the final update to set '0 + 1 = 1' and date = today.
      }

      if (currentCount >= 2) {
        Get.snackbar(
          'Limit Reached',
          'You can only start 2 wars per day.',
          backgroundColor: Get.theme.colorScheme.error,
          colorText: Colors.white,
        );
        return false;
      }

      // 2. Create Poll
      await _supabase.from('polls').insert({
        'creator_id': user.id,
        'question': question,
        'option_a': optA,
        'option_b': optB,
        'is_official': false,
      });

      // 3. Update Profile Limits
      await _supabase
          .from('profiles')
          .update({
            'daily_post_count': currentCount + 1,
            'last_post_date': today,
          })
          .eq('id', user.id);

      // Update local profile state
      await authController.initializeProfile();

      // 4. Refresh List
      fetchCommunityPolls();

      Get.snackbar('War Started!', 'Your poll is live.');
      return true;
    } catch (e) {
      Get.snackbar('Error', 'Failed to create poll: $e');
      return false;
    }
  }
}
