import { api } from "./api";


export type BaseModelsResp = { baseModels: string[]; localModels: Record<string, any> };
export async function listModels() {
return api<BaseModelsResp>("/models");
}


export async function startTrain(base_model_id: string, files: File[], use_lora = true) {
const fd = new FormData();
fd.append("base_model_id", base_model_id);
fd.append("use_lora", String(use_lora));
files.forEach(f => fd.append("files", f));
return api<{ job_id: string; status: string }>("/train", { method: "POST", body: fd });
}


export async function pollProgress(jobId: string) {
return api<{ status: string; model_id?: string; meta?: any }>(`/progress/${jobId}`);
}


export type ModifyPayload = {
modelId: string;
temperature?: number;
tokenLimit?: number;
topP?: number;
topK?: number;
stop?: string[];
instructions?: string;
};
export async function modifyModel(p: ModifyPayload) {
return api<{ success: boolean; modelId: string }>("/modify-file", {
method: "POST",
body: JSON.stringify({
modelId: p.modelId,
temperature: p.temperature ?? 0.7,
tokenLimit: p.tokenLimit ?? 256,
topP: p.topP,
topK: p.topK,
stop: p.stop,
instructions: p.instructions ?? "",
}),
});
}


export async function loadLocal(modelId: string) {
return api<{ success: boolean; loaded: string }>(`/load-local?model_id=${encodeURIComponent(modelId)}`);
}


export async function runChat(modelId: string, prompt: string) {
return api<{ success: boolean; source: string; response: string }>("/run", {
method: "POST",
body: JSON.stringify({ modelId, prompt }),
});
}
