// Common_service_client.js
import request from '@/utils/request';
import {getSysConfigFormId} from "@/api/constant/form_constant.js";
import {fetchSubDataBatch, fetchTableData} from "@/api/query_data.js";
import {SERVICE_CODES} from "@/api/constant/service_codes.js";

const PARAM_LIST_FIELD_NAME = 'params';

const SERVICE_CONFIG_FORM_ID = "SERVICE_CONFIG_FORM_ID";

class Common_service_client {
    constructor() {
        this.serviceConfigMap = new Map();  // key: serviceName, value: service配置对象
        this._initialized = false;
    }

    async init() {
        if (this._initialized) return;

        // 1. 获取主表数据
        const serviceRes = await fetchTableData(1, 1000, getSysConfigFormId(SERVICE_CONFIG_FORM_ID), []);
        const serviceList = serviceRes.data.list || [];

        // 2. 构建 reid 列表
        const reIds = serviceList.map(service => service.id).filter(Boolean);

        // 3. 一次性获取子表数据（参数列表）
        const subRes = await fetchSubDataBatch(getSysConfigFormId(SERVICE_CONFIG_FORM_ID), PARAM_LIST_FIELD_NAME, reIds);
        const paramDataMap = subRes.data || {};

        // 4. 构建服务配置 Map 和参数 Map
        // 4. 构建服务配置 Map，直接将子表数据嵌入主表中
        for (const service of serviceList) {
            const reid = service.id;
            // 将子表数据挂载到主表对象中，以字段名为 key
            service[PARAM_LIST_FIELD_NAME] = paramDataMap[reid] || [];
            // 放入主 Map 中
            this.serviceConfigMap.set(service.name_code, service);
        }


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

    // 👇 以下是业务调用封装方法

    async repairPlan(params) {
        return this.invoke(SERVICE_CODES.REPAIR_PLAN, params);
    }

    async checkQuery(params) {
        return this.invoke(SERVICE_CODES.CHECK_QUERY, params);
    }

    async featureTrendForecast(params) {
        return this.invoke(SERVICE_CODES.FEATURE_TREND_FORCAST, params);
    }

    async predictDevice(params) {
        return this.invoke(SERVICE_CODES.PREDICT_DEVICE, params);
    }

    async diagnoseFault(params) {
        return this.invoke(SERVICE_CODES.DIAGNOSE_FAULT, params);
    }

    async evaluateState(params) {
        return this.invoke(SERVICE_CODES.EVALUE_STATE, params);
    }

    async evaluateDevState(params) {
        return this.invoke(SERVICE_CODES.EVALUE_DEV_STATE, params);
    }


}

export const commonServiceClient = new Common_service_client();
