### 排查场景
本次故障是由于 JVM 中 Metaspace 区不断加载新的类，导致内存持续增长并最终 OOM。怀疑为类加载异常，需要定位加载异常的 ClassLoader 和具体的类。

--- 

### Metaspace 泄漏排查流程

下面给出一个系统化的“Metaspace 泄漏”排查流程，分为数据采集、定位分析、根因修复、持续监控四个阶段：

1. **数据采集**
- **检查 jvm 支持的 jcmd 命令**  
查询应用的进程 id
    ```bash
    jcmd -l
    ```
查询应用支持的命令
```bash
jcmd <pid> help
```
<img src="{{ '/assets/post/meta_analyze/jcmd_comman_list.png' | relative_url }}" width="50%">

[//]: # (![img.png]&#40;../assets/post/meta_analyze/jcmd_comman_list.png&#41;)
- **ClassLoader 统计**
  ```bash
  jcmd <pid> VM.classloader_stats
  ```
  关注 Loaded、Unloaded 以及 Bytes（Reserved/Used）。

   #### 示例输出
  ```bash
  jcmd 23401 VM.classloader_stats
  ```
  ```text
  23401:
  ClassLoader                                        Loaded  Unloaded    Bytes
  --------------------------------------------------------------------------
  com.app.MainClassLoader@1a2b3c                         500         0     5 242 880
  com.alibaba.fastjson2.util.DynamicClassLoader@4d5e6f    985         0    11 490 440
  ```
  - **Loaded**：该 ClassLoader 累计加载的类数量。
  - **Unloaded**：该 ClassLoader 累计卸载的类数量。
  - **Bytes**：当前 Metaspace 中此 ClassLoader 所加载类元数据的实际占用字节数。
  - **ClassLoader**：类加载器的标识。

2. **定位分析**
    - **Metaspace Dump（可选）**
      ```bash
      jcmd <pid> VM.metaspace_dump /tmp/metaspace.dump
      ```
    - **Heap Dump + Eclipse MAT**
        1. 打开 `.hprof` 并切到 Class Loader Explorer。
        2. 找到可疑 ClassLoader，查看 incoming references 和 loaded classes。
    - **在线抓取 Class Loading**
        - **JFR（Java Flight Recorder）**
          ```bash
          jcmd <pid> JFR.start name=cs_record settings=profile duration=1m filename=cs.jfr
          ```
          在 JMC 中过滤 Loader 为目标 ClassLoader，查看 Stack Trace。
        - **BTrace 钩挂** `DynamicClassLoader.defineClass(...)`，打印类名和堆栈。

3. **根因修复**
    - **Fastjson2 ASM 泄漏**
      ```java
      JSONFactory.getDefaultObjectReaderProvider().disableASM();
      JSONFactory.getDefaultObjectWriterProvider().disableASM();
      ```
      或升级至 2.0.56+。
    - **统一序列化上下文**：复用同一个 `TypeReference`、`SerializerFeature`、`Filter` 等。
    - **检查热部署/插件机制**：避免重复创建 ClassLoader。
    - **最终确认**：Fastjson2 在运行时频繁为同一个类生成动态类，并不断加载至 `com.alibaba.fastjson2.util.DynamicClassLoader`，导致 Metaspace 泄漏。重复加载的具体原因可能与 Fastjson2 的缓存策略或内部 BUG 有关，需要进一步排查或等待官方修复。

4. **持续监控**
    - **定期采集**
      ```bash
      jcmd <pid> VM.native_memory summary
      jcmd <pid> VM.classloader_stats
      ```
      配合监控系统报警。
    - **打开类加载日志**
      ```text
      -XX:+TraceClassLoading -XX:+TraceClassUnloading
      ```  
    - **升级 JVM 版本**：选择 HotSpot 8uXXX 或更高版本，或最新 OpenJDK。

### 检查 JVM 是否支持 `jcmd <pid> VM.classloader_stats` 命令

1. **确认 jcmd 与应用 JVM 匹配**
   ```bash
   which jcmd && jcmd -version