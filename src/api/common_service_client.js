// Common_service_client.js
import request from '@/utils/request';

class Common_service_client {
    constructor() {
        this.serviceConfigMap = new Map();  // key: serviceName, value: service配置对象
        this._initialized = false;
    }

    async init() {
        if (this._initialized) return;
        
        // 简化初始化，移除业务相关的配置加载
        this._initialized = true;
    }

    async invoke(serviceNameCode, bizData = {}) {
        await this.init();

        const service = this.serviceConfigMap.get(serviceNameCode);
        if (!service) throw new Error(`服务未找到: ${serviceNameCode}`);

        return request({
            url: '/diagnosis/py/service/invoke',
            method: 'post',
            data: {
                type: serviceNameCode,
                service,     // 完整服务配置传给后端
                bizData      // 业务参数（动态构造）
            }
        });
    }
}

export const commonServiceClient = new Common_service_client();
