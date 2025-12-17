class Vote {
  final String? id;
  final String pollId;
  final String userId;
  final String choice;

  Vote({
    this.id,
    required this.pollId,
    required this.userId,
    required this.choice,
  });

  factory Vote.fromJson(Map<String, dynamic> json) {
    return Vote(
      id: json['id'] as String?,
      pollId: json['poll_id'] as String,
      userId: json['user_id'] as String,
      choice: json['choice'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'poll_id': pollId, 'user_id': userId, 'choice': choice};
  }
}
