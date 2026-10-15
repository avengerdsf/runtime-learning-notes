export default function(root) {
const getElementById=id=>root.querySelector('[id="'+id+'"]');

const taskEntries=[{"key":"T_E1","stream":"Stream E（执行流）","kind":"compute","label":"前置计算"},{"key":"T_E2","stream":"Stream E（执行流）","kind":"model","label":"模型启动"},{"key":"T_E3","stream":"Stream E（执行流）","kind":"compute","label":"后续计算"},{"key":"T_A1","stream":"Stream A（模型流 · HEAD）","kind":"compute","label":"计算"},{"key":"T_A2","stream":"Stream A（模型流 · HEAD）","kind":"switch","label":"条件切换"},{"key":"T_A3","stream":"Stream A（模型流 · HEAD）","kind":"active","label":"直接激活"},{"key":"T_A4","stream":"Stream A（模型流 · HEAD）","kind":"compute","label":"计算"},{"key":"T_B1","stream":"Stream B（模型流 · WAIT_ACTIVE）","kind":"compute","label":"计算"},{"key":"T_B2","stream":"Stream B（模型流 · WAIT_ACTIVE）","kind":"index","label":"索引跳转"},{"key":"T_B3","stream":"Stream B（模型流 · WAIT_ACTIVE）","kind":"compute","label":"计算"},{"key":"T_B4","stream":"Stream B（模型流 · WAIT_ACTIVE）","kind":"compute","label":"目标计算"},{"key":"T_C1","stream":"Stream C（模型流 · WAIT_ACTIVE）","kind":"compute","label":"计算"},{"key":"T_C2","stream":"Stream C（模型流 · WAIT_ACTIVE）","kind":"compute","label":"计算"},{"key":"T_C3","stream":"Stream C（模型流 · WAIT_ACTIVE）","kind":"compute","label":"计算"}];
const taskViews={"compute":{"title":"计算 task（AIC 示例）","type":"计算任务","union":"u.aicTaskInfo","summary":"<strong>计算 task 保存计算入口与运行参数，执行计算工作。</strong>图中方块是任务位置示意，下面展示源码字段的含义。","fields":[["kernel","计算 kernel 的 Host 对象"],["comm.args","运行参数包地址"],["comm.argsSize","参数包长度"],["comm.dim","计算启动规模"]],"pointer":"comm.args 等字段引用运行参数与执行描述","memoryTitle":"Device 运行参数与计算执行描述","memory":"设备侧执行描述包含计算入口和参数地址，计算核按参数执行任务。TaskInfo 保留 Host 管理信息。","snapshot":"备份关联：计算任务参数及相关执行描述按对应参数收集路径处理。","source":"src/runtime/core/inc/task/task_info_base.hpp"},"model":{"title":"模型启动 task","type":"TS_TASK_TYPE_MODEL_EXECUTE","union":"u.modelExecuteTaskInfo","summary":"<strong>模型启动 task 位于执行流 E，用于启动 Model M1。</strong>E 的执行入口角色与 Model 绑定流分别维护。","fields":[["model","指向 Model M1 的 Host 对象"],["modelId","设备侧模型标识"],["firstTaskId","模型入口任务标识"],["errorTaskId / errorStreamId","模型执行错误的任务与流标识"]],"pointer":"模型标识与入口信息进入设备执行描述","memoryTitle":"Device 模型执行任务 / SQE","memory":"设备按模型入口流和调度关系推进 M1 的任务。执行流 E 提交启动任务，A / B / C 承载模型构建的任务。","snapshot":"备份关联：Model 恢复还需要重建模型、绑定流与 SQ 任务关系。","source":"src/runtime/core/inc/task/task_info_struct.hpp"},"switch":{"title":"条件切换 task","type":"TS_TASK_TYPE_STREAM_SWITCH","union":"u.streamswitchTask","summary":"<strong>读取比较值并按 condition 判断，条件满足时控制目标流 B。</strong>控制 task 自身属于流 A。","fields":[["ptr","被比较值所在的 Device 地址"],["valuePtr","V2 接口比较目标值的 Device 地址"],["condition / dataType","比较规则与数据类型"],["trueStream / trueStreamId","目标 Stream B 及其标识"],["funcCallSvmMem","Device 条件切换控制指令地址"],["funCallMemSize","控制指令内存长度"]],"pointer":"funcCallSvmMem 指向 Device 控制指令","memoryTitle":"Device 条件切换控制程序","memory":"程序按 ptr、valuePtr 与 condition 执行比较，并根据目标流信息控制后续调度。","snapshot":"备份收集：funcCallSvmMem 指向的控制指令内存及其长度。比较值所在内存按对应的内存备份路径处理。","source":"src/runtime/core/inc/task/task_info_struct_cond.hpp"},"active":{"title":"直接激活流 task","type":"TS_TASK_TYPE_STREAM_ACTIVE","union":"u.streamactiveTask","summary":"<strong>激活已经创建的 Stream C，使其任务进入后续调度。</strong>此 task 自身仍记录在流 A。","fields":[["activeStream","指向目标 Stream C"],["activeStreamId","目标流标识"],["activeStreamSqId","适用平台中的目标 SQ ID"],["funcCallSvmMem","Device 激活控制指令地址"],["funCallMemSize","激活指令内存长度"]],"pointer":"funcCallSvmMem 指向 Device 激活指令","memoryTitle":"Device 流激活控制程序","memory":"设备执行目标流激活动作，后续由调度推进 C 上的任务。目标 Stream 在控制 task 初始化前已经存在。","snapshot":"备份收集：streamactiveTask.funcCallSvmMem 指向的控制程序；恢复还会修正适用的激活指令与 SQE。","source":"src/runtime/core/inc/task/task_info_struct_cond.hpp"},"index":{"title":"按索引跳转 task","type":"TS_TASK_TYPE_STREAM_LABEL_SWITCH_BY_INDEX","union":"u.stmLabelSwitchIdxTask","summary":"<strong>从 indexPtr 读取索引，在 labelInfoPtr 标签表中选择目标 SQ 与执行位置。</strong>本示例用目标位置 T_B4 展示跳转关系。","fields":[["indexPtr","用于选取标签的索引值地址"],["labelInfoPtr","目标 SQ 与执行位置的信息表地址"],["max","可选择的标签数量上限"],["funcCallSvmMem","Device 索引跳转控制指令地址"],["funCallMemSize","控制指令内存长度"]],"pointer":"控制程序引用 indexPtr 与 labelInfoPtr","memoryTitle":"Device 跳转程序、索引值与标签表","memory":"控制程序读取索引值，再查目标信息表并选择执行位置。taskSn 用于任务跟踪，跳转目标由索引与标签表共同决定。","snapshot":"备份收集：控制指令内存、indexPtr 所在的索引内存，以及 labelInfoPtr 指向的标签信息表。","source":"src/runtime/core/inc/task/task_info_struct_cond.hpp"}};
const taskModal=getElementById('task-inspector');
function fillTaskFields(elementId,rows){
 const container=getElementById(elementId);container.replaceChildren();
 for(const row of rows){const field=document.createElement('div');field.className='task-field';const name=document.createElement('code');name.textContent=row[0];const value=document.createElement('span');value.textContent=row[1];field.append(name,value);container.append(field);}
}
for(const button of root.querySelectorAll('[data-task-key]'))button.addEventListener('click',()=>{
 const entry=taskEntries.find(item=>item.key===button.dataset.taskKey);const view=taskViews[entry.kind];
 getElementById('task-inspector-title').textContent=entry.key+' · '+view.title;
 getElementById('task-inspector-summary').innerHTML=view.summary;
 fillTaskFields('task-common-fields',[['stream',entry.stream+'：本 task 所属流'],['type / typeName',view.type],['id','Runtime 任务编号；'+entry.key+' 是本图示意标号'],['taskSn','Dump / profiling 跟踪序号'],['pos','任务在提交队列中的位置'],['sqeNum','本 task 下发的 SQE 条目数量']]);
 getElementById('task-union-title').textContent=view.union+' · 按 task 类型使用的专用字段';
 fillTaskFields('task-specific-fields',view.fields);
 getElementById('task-pointer-label').textContent=view.pointer;
 getElementById('task-memory-title').textContent=view.memoryTitle;
 getElementById('task-memory-description').textContent=view.memory;
 getElementById('task-snapshot-description').textContent=view.snapshot;
 getElementById('task-source-link').href='https://gitcode.com/cann/runtime/blob/e1673456054c7b71fe224e99aacca36050ea5b44/'+view.source;
 taskModal.showModal();taskModal.scrollTop=0;
});
taskModal.querySelector('.task-close').addEventListener('click',()=>taskModal.close());
for(const node of root.querySelectorAll('[data-task-key]'))node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});



const sqeRegions={"header":{"title":"公共头区","range":"0–7 字节 · 8B","purpose":"任务类型、Block 数、所属流、任务 ID 与报告控制","source":"src/runtime/core/inc/task/task_info_base.hpp","line":42,"fields":[["type / l1_lock / l1_unlock","字节 0：任务类型及 L1 锁控制位。"],["ie / pre_p / post_p / wr_cqe","字节 1：中断与完成报告等控制位。wr_cqe 控制完成报告写入。"],["block_dim","字节 2–3：本次启动的 Block 数。"],["rt_stream_id","字节 4–5：所属流的 Runtime ID。"],["task_id","字节 6–7：本次任务的 ID。"]]},"config":{"title":"执行配置区","range":"8–31 字节 · 24B","purpose":"调度与预取、栈地址、QoS 及访存相关配置","source":"src/runtime/core/inc/sqe/v100/stars_kernel.hpp","line":166,"fields":[["fftsType / wrr_ratio / res1 / res2","字节 8–11：执行类型、调度比例和保留位。"],["sqe_index","字节 12–13：条目索引字段。"],["kernel_credit / schem / icache_prefetch_cnt","字节 14–15：执行、调度和指令预取相关配置，另含保留位 res3。"],["stackPhyBaseLow / stackPhyBaseHigh","字节 16–23：Device 栈物理地址的低、高 32 位。"],["res4","字节 24–27：保留字段。"],["pmg / ns / part_id / qos","字节 28–31：调度与访存相关属性，另含保留位 res5、res6。"]]},"pc":{"title":"代码入口区","range":"32–39 字节 · 8B","purpose":"本次 Kernel 的设备代码入口 PC","source":"src/runtime/core/inc/sqe/v100/stars_kernel.hpp","line":184,"fields":[["pc_addr_low","字节 32–35：设备代码入口地址的低 32 位，来自任务的 funcAddr。"],["pcAddrHigh","字节 36–37：设备代码入口地址的高 16 位。"],["res7","字节 38–39：保留位。"]]},"args":{"title":"参数地址区","range":"40–47 字节 · 8B","purpose":"本次运行参数包的 Device 地址","source":"src/runtime/core/inc/sqe/v100/stars_kernel.hpp","line":187,"fields":[["paramAddrLow","字节 40–43：参数区地址的低 32 位，来自任务的 comm.args。"],["param_addr_high","字节 44–47：参数地址高位；部分场景还编码栈配置信息。"]]},"extra":{"title":"扩展字段区","range":"48–63 字节 · 16B","purpose":"参数长度、性能标志及保留字段等","source":"src/runtime/core/inc/sqe/v100/stars_kernel.hpp","line":189,"fields":[["res8[0]","字节 48–51：按场景使用，部分场景记录参数区字节数。"],["res8[1]","字节 52–55：按场景记录性能、缓存等扩展标志。"],["res8[2]","字节 56–59：扩展或保留字段。"],["res8[3]","字节 60–63：扩展或保留字段。"]]}};
const sqeInspector=getElementById('sqe-inspector');
function openSqeRegion(key){
 const region=sqeRegions[key];
 getElementById('sqe-inspector-title').textContent=region.title+' · '+region.range;
 getElementById('sqe-inspector-summary').textContent=region.purpose;
 fillTaskFields('sqe-field-cards',region.fields);
 getElementById('sqe-source-link').href='https://gitcode.com/cann/runtime/blob/e1673456054c7b71fe224e99aacca36050ea5b44/'+region.source+'#L'+region.line;
 getElementById('sqe-source-location').textContent=region.source+':'+region.line;
 sqeInspector.showModal();sqeInspector.scrollTop=0;
}
for(const node of root.querySelectorAll('[data-sqe-region]')){
 node.addEventListener('click',()=>openSqeRegion(node.dataset.sqeRegion));
 node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openSqeRegion(node.dataset.sqeRegion);}});
}
getElementById('sqe-close').addEventListener('click',()=>sqeInspector.close());


const elfRegions={"header":{"title":"文件头与索引区","purpose":"格式、目标架构、节头索引与布局信息","source":"src/runtime/core/inc/kernel/elf.hpp","line":262,"fields":[["e_ident / e_type / e_machine","ELF 标识、文件类型与目标架构。"],["e_shoff / e_shnum / e_shentsize","节头表的位置、条目数量和条目大小。"],["e_shstrndx","记录节名称字符串表的索引。"],["Section Header Table","每个节头记录 sh_type、sh_flags、sh_offset、sh_size、sh_link 等，供 Runtime 定位与解析各节。"],["e_phoff / e_phnum","程序头表的位置和数量；表项存在时描述加载段。"]]},"code":{"title":"代码区","purpose":"保存 Kernel 的机器指令","source":"src/runtime/core/src/kernel/elf.cc","line":1453,"fields":[[".text / .text.*","常见代码节名称，保存编译后的 Kernel 机器指令。具体节信息以产物为准。"],["sh_offset / sh_size","节在 ELF 文件中的偏移与长度。"],["SHF_ALLOC 等节属性","Runtime 根据节属性整理可加载范围；范围可覆盖多个节。"]]},"data":{"title":"数据区","purpose":"编译期常量与全局数据，按产物提供","source":"src/runtime/core/src/kernel/elf.cc","line":22,"fields":[[".rodata","编译期生成的只读常量，存在时随二进制组织。"],[".data","已初始化的全局数据，是否存在由编译产物决定。"],["运行时数据与参数","本次调用的 X、W、Y 地址及参数包关系，见后面的执行资源图。"]]},"meta":{"title":"算子元数据区","purpose":"Kernel 类型、核配比、栈大小和参数描述等","source":"src/runtime/core/src/kernel/elf.cc","line":787,"fields":[[".ascend.meta","二进制级元信息，Runtime 按 TLV 等格式读取。"],[".ascend.meta.\u003ckernel>","与具体 Kernel 对应的元信息节，提供执行类型、核配比、参数描述等。"],[".ascend.stack.size.record","相关产物中记录栈大小信息的节。"]]},"symbols":{"title":"符号与名称区","purpose":"Kernel 名称、函数位置与长度，以及节名称等","source":"src/runtime/core/src/kernel/elf.cc","line":1227,"fields":[[".symtab","符号表，函数符号记录 st_name、st_value、st_size、st_info、st_shndx 等。"],["st_name → .strtab","st_name 给出名称在字符串表中的位置，Runtime 从中取得 Kernel 名称。"],["st_value / st_size","提供函数位置与长度，供 Kernel 入口解析使用。"],[".shstrtab","保存节名称，节头中的 sh_name 指向相应名称。"]]},"dynamic":{"title":"动态信息区","purpose":"ELF 携带的 SO 名称及动态信息，按产物提供","source":"src/runtime/core/src/kernel/elf.cc","line":1331,"fields":[[".dynamic","存在时保存动态信息条目。"],["DT_SONAME","存在时提供 SO 名称在动态字符串表中的位置。"],[".dynstr","动态字符串表；Runtime 根据 DT_SONAME 的值读取 ELF 携带的 SO 名称。"]]}};
const elfInspector=getElementById('elf-inspector');
function openElfRegion(key){
 const region=elfRegions[key];
 getElementById('elf-inspector-title').textContent=region.title;
 getElementById('elf-inspector-summary').textContent=region.purpose;
 fillTaskFields('elf-field-cards',region.fields);
 getElementById('elf-source-link').href='https://gitcode.com/cann/runtime/blob/e1673456054c7b71fe224e99aacca36050ea5b44/'+region.source+'#L'+region.line;
 getElementById('elf-source-location').textContent=region.source+':'+region.line;
 elfInspector.showModal();elfInspector.scrollTop=0;
}
for(const node of root.querySelectorAll('[data-elf-region]')){
 node.addEventListener('click',()=>openElfRegion(node.dataset.elfRegion));
 node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openElfRegion(node.dataset.elfRegion);}});
}
getElementById('elf-close').addEventListener('click',()=>elfInspector.close());

}
