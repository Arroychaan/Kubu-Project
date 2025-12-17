class Poll {
  final String id;
  final String? creatorId;
  final String question;
  final String optionA;
  final String optionB;
  final bool isOfficial;
  final DateTime createdAt;
  final int countA;
  final int countB;

  Poll({
    required this.id,
    this.creatorId,
    required this.question,
    required this.optionA,
    required this.optionB,
    this.isOfficial = false,
    required this.createdAt,
    this.countA = 0,
    this.countB = 0,
  });

  factory Poll.fromJson(Map<String, dynamic> json) {
    return Poll(
      id: json['id'] as String,
      creatorId: json['creator_id'] as String?,
      question: json['question'] as String,
      optionA: json['option_a'] as String,
      optionB: json['option_b'] as String,
      isOfficial: json['is_official'] as bool? ?? false,
      createdAt:
          DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now(),
      // Stats might come from a joined view or separate query.
      // Handling both flattened (if view joined) or nested cases.
      countA: (json['poll_stats'] != null)
          ? (json['poll_stats']['count_a'] as int? ?? 0)
          : (json['count_a'] as int? ?? 0),
      countB: (json['poll_stats'] != null)
          ? (json['poll_stats']['count_b'] as int? ?? 0)
          : (json['count_b'] as int? ?? 0),
    );
  }

  double get totalVotes => (countA + countB).toDouble();

  // Calculate percentages for the Tug of War
  double get percentA {
    if (totalVotes == 0) return 0.5; // Default 50%
    return countA / totalVotes;
  }

  double get percentB {
    if (totalVotes == 0) return 0.5; // Default 50%
    return countB / totalVotes;
  }
}
