import 'package:get/get.dart';
import '../controllers/poll_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<PollController>(() => PollController());
  }
}
