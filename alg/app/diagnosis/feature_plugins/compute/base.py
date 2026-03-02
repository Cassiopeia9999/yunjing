from typing import Dict, Any

def debug_signal(signal: Dict[str, Any], plugin_name: str = "", **kwargs):
    """统一调试输出 signal 对象结构和参数"""
    print(f"\n🔍 插件 [{plugin_name}] compute() 被调用")
    for k, v in kwargs.items():
        print(f"📌 参数 {k} = {v}")

    print("\n📦 signal 内容结构预览：")

    # 打印 feature 信息
    feature = signal.get("feature", {})
    print(f"  🔹 feature = {feature}")

    channel_data_map = signal.get("channel_data_map", {}) or {}

    print("\n====== 🔍 channel_data_map 调试输出 ======")

    if not channel_data_map:
        print("⚠️ channel_data_map 为空，未收到任何通道数据")
        print("=========================================\n")
        return

    # 遍历每个通道
    for channel_id, ch_payload in channel_data_map.items():
        print(f"\n📦 通道 {channel_id} :")

        if not isinstance(ch_payload, dict):
            print(f"  ❌ 非 dict，实际是 {type(ch_payload).__name__}")
            continue

        # 遍历字段
        for field_name, field_val in ch_payload.items():
            if isinstance(field_val, list):
                # 打印前5个，和总长度
                preview = field_val[:5]
                print(f"  - {field_name}: list[{len(field_val)}], 前5项={preview}")
            else:
                # 非列表字段，直接打印
                print(f"  - {field_name}: {field_val} ({type(field_val).__name__})")

    print("\n=========================================\n")
