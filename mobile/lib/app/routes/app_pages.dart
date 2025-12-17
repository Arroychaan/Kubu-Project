import 'package:get/get.dart';
import '../modules/auth/controllers/auth_controller.dart';
import '../modules/home/bindings/home_binding.dart';
import '../modules/home/views/home_view.dart';
import '../modules/auth/views/login_view.dart';
import '../middlewares/auth_middleware.dart';
import 'app_routes.dart';

class AppPages {
  // Guest-First: Start at Home
  static const initial = Routes.home;

  static final routes = [
    GetPage(
      name: Routes.home,
      page: () => const HomeView(),
      binding: HomeBinding(),
      // Remove AuthMiddleware to allow guest access
      // middlewares: [AuthMiddleware()],
    ),
    GetPage(
      name: Routes.login,
      page: () => const LoginView(),
      middlewares: [
        AuthMiddleware(),
      ], // Keep here to redirect if already logged in? Or valid to revisit
    ),
  ];
}

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(AuthController(), permanent: true);
  }
}
