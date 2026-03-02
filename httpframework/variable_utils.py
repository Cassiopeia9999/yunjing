import time

class VariableUtils:
    """
    变量处理工具类
    - 自动补充系统必需字段，比如 _timestamp, isTrusted
    """

    @staticmethod
    def prepare_variables(variables: dict) -> dict:
        """
        补充系统字段到变量字典
        :param variables: 原始用户传入的业务字段
        :return: 增强后的字段
        """
        if not isinstance(variables, dict):
            raise ValueError("variables 必须是一个字典类型")

        # 补充 _timestamp
        variables["_timestamp"] = int(time.time() * 1000)

        # 补充 isTrusted
        variables["isTrusted"] = True

        # 后面可以继续在这里加其他标准字段，比如 creator、create_time等
        return variables
