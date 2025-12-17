class Profile {
  final String id;
  final String? username;
  final int dailyPostCount;
  final String lastPostDate;

  Profile({
    required this.id,
    this.username,
    this.dailyPostCount = 0,
    this.lastPostDate = '2025-01-01',
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      username: json['username'] as String?,
      dailyPostCount: json['daily_post_count'] as int? ?? 0,
      lastPostDate: json['last_post_date'] as String? ?? '2025-01-01',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'daily_post_count': dailyPostCount,
      'last_post_date': lastPostDate,
    };
  }
}
