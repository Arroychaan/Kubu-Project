import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../data/models/poll_model.dart';

class HomeController extends GetxController {
  // Use try/catch for client access in case it's not initialized
  SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  final polls = <Poll>[].obs;
  final isLoading = true.obs;

  @override
  void onInit() {
    super.onInit();
    fetchPolls();
  }

  Future<void> fetchPolls() async {
    isLoading.value = true;
    try {
      if (_supabase == null) {
        // Mock data for UI demonstration if no Supabase config
        await Future.delayed(const Duration(seconds: 1));
        polls.value = [
          Poll(
            id: '1',
            question: 'Best Mobile Framework?',
            optionA: 'Flutter',
            optionB: 'React Native',
            isOfficial: true,
            createdAt: DateTime.now(),
            countA: 1500,
            countB: 800,
          ),
          Poll(
            id: '2',
            question: 'Is Pizza Healthy?',
            optionA: 'Yes',
            optionB: 'No',
            isOfficial: false,
            createdAt: DateTime.now(),
            countA: 300,
            countB: 320,
          ),
        ];
        return;
      }

      // Real fetch
      // Strategy: Fetch Polls first. Then fetch stats.
      final pollsResponse = await _supabase!
          .from('polls')
          .select()
          .order('created_at', ascending: false);
      final List<dynamic> pollsData = pollsResponse;

      // Fetch stats
      final statsResponse = await _supabase!.from('poll_stats').select();
      final List<dynamic> statsData = statsResponse;

      // Merge
      final Map<String, Map<String, dynamic>> statsMap = {
        for (var s in statsData) s['poll_id'].toString(): s,
      };

      polls.value = pollsData.map((p) {
        final Map<String, dynamic> pollMap = Map<String, dynamic>.from(p);
        final stat = statsMap[p['id']];
        if (stat != null) {
          pollMap['poll_stats'] = stat;
        }
        return Poll.fromJson(pollMap);
      }).toList();
    } catch (e) {
      Get.snackbar('Error', 'Failed to fetch polls: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> vote(String pollId, String choice) async {
    if (_supabase == null) return;
    try {
      final user = _supabase!.auth.currentUser;
      if (user == null) {
        Get.snackbar('Auth', 'Please login to vote');
        return;
      }

      await _supabase!.from('votes').insert({
        'poll_id': pollId,
        'user_id': user.id,
        'choice': choice,
      });

      // Optimistic update or refetch
      fetchPolls();
      Get.snackbar('Success', 'Vote cast!');
    } catch (e) {
      Get.snackbar('Error', 'Failed to vote: $e');
    }
  }
}
