---

---
### 为什么要用azure-pipeline
#### 为什么要用
因为自己有一些想搭建的服务，但是自己打包部署服务感觉挺麻烦的，
最简单也需要在服务端写个脚本自动下载应用并打包部署。但是过程也不好监控。

#### 为什么选azure-pipeline
选azure-pipeline指示因为公司最近考虑使用azure devops来做CICD，所以就用了。
实际上，每个云平台都有一定的免费CICD额度供个人用户使用。



### azure devops注册账号
[azure devops 官网](https://azure.microsoft.com/en-us/products/devops)

先在官网注册账号。注册账号之后，就需要创建组织了。

<img src="{{ '/assets/post/create-azure-pipeline/create-organization.png' | relative_url }}" width="50%">

组织创建完成之后，创建一个项目，就可以使用自己的devops了。

<img src="{{ '/assets/post/create-azure-pipeline/create-project.png' | relative_url }}" width="70%">


### 创建pipeline
在azure devops里，可以直接不管敏捷开发那一套，直接来使用pipeline功能。
<img src="{{ '/assets/post/create-azure-pipeline/create-pipeline.png' | relative_url }}" width="50%">
1. 代码位置选择自己所用的代码仓库。
2. 选择好代码仓库之后，就会让你选择具体的代码repository
3. azure会根据你的代码类型自动的创建一个pipeline的yaml文件。这个可以不用管。

到目前为止，你的yaml文件就创建好了。

### 配置pipeline
刚开始创建的pipeline是根据项目语言自动识别的。到这里就需要更加的深入理解pipeline是什么了。
首先，pipeline是一个流水线，也就是你的代码会经过一系列的步骤，然后才能部署到你的服务器。
pipeline的步骤可以分成三个部分：
1. 构建步骤：也就是你的代码编译打包，生成可执行的文件。
2. 发布包到你的服务器，比如你的代码编译打包之后，生成了一个可执行的文件，但是这个文件需要部署到你的服务器上，才能被服务器部署。
3. 远程执行服务器部署。

正常一个普通的项目就可以这么使用pipeline进行部署。说起来简单，但是部署的每个单元都需要准备好。
#### 首先是代码
为了能方便适应所有的环境，我决定使用docker来部署应用。那么，就需要给自己的项目配置dockerFile。
并确保能正确的打出镜像，镜像可用。
#### 其次就是服务器
服务器需要能接收到镜像，并且能正确部署。我们可以在打包的时候，把镜像文件保存起来直接传输到服务器上，
然后在服务器上load这个镜像文件，再部署到服务器的容器了。这个方法是可行的，但其实比较繁琐。而且你每次构建的镜像
并没有被保存起来，也不合适。生产的镜像最好有个归档。起码保存3个版本。所以，我决定使用docker hub来保存镜像。
**准备一个docker registry**
[docker hub](https://hub.docker.com/)虽然是可以用的，但是国内的网络环境访问还是很慢的。所以我这边直接使用了
阿里云的容器仓库服务。
[注册一个阿里云容器仓库](https://cr.console.aliyun.com/)

阿里云的仓库可以免费使用3个命名空间，共计300个仓库。还是蛮划算的。指示流量有限制，具体可以看个人版的文档。  

**服务器配置**  
有了阿里云镜像之后，就是要配置服务器的环境了。
1. 安装一个docker的容器环境。
2. 测试docker能否登陆阿里云的容器仓库。
3. 尝试在本地项目打包镜像并上传到阿里云容器仓库，并在服务器下载镜像并部署。确实可以之后。就可以去pipeline
完成这一整个链路了。这里还涉及到如何使用pass保存镜像仓库的密钥，避免密钥泄漏。还要通过GPG来加密密钥。后续再补充。

#### 开始配置pipeline
**yaml语法**
pipeline的配置完全是通过yaml文件来完成的。所以需要线学习一个pipeline的yaml语法（这里假设你已经懂yaml本身的格式了）。
跟jenkins的pipeline类似，azure的pipeline也是树形的结构。大致可以分为三层。
1. stages: stage是pipeline的最大执行单元，可以用与分割多个阶段的继承代码
2. jobs: job是stage的最小执行单元，可以包含多个tasks。一个stage可以有多个job。
3. task: task是job下的分支，一个job可以包含多个tasks，比较特殊的是，job下的task是通过steps来关联的。

**service connection**  
在pipeline中，需要使用service connection来连接你的服务器。包括ssh连接服务器，还有登陆阿里云镜像仓库来push镜像。
创建一个镜像仓库的service connection。可以在项目设置里找到服务链接，创建一个 docker registry即可。


#### stage1 打包镜像并发布到阿里云容器仓库
```yaml
variables:
  tag: '$(Build.BuildId)'

stages:
- stage: Build_and_push
  displayName: Build and push image
  jobs:
  - job: Build
    displayName: Build
    pool:
      vmImage: ubuntu-latest
    steps:
    - task: Docker@2
      displayName: build and push
      inputs:
        containerRegistry: 'aliyun-registry'
        repository: 'xxx/azure-test'
        command: 'buildAndPush'
        Dockerfile: '$(Build.SourcesDirectory)/Dockerfile'
```
这是一个任务单元，使用的是azure pipeline预设的任务
* command决定了这个预设任务做什么，
这是约定好的值不能改，这个command就是构建docker镜像并发布到镜像仓库。
* containerRegistry
就是我们配置好的仓库的service connection名称。
* repository就是我们push的镜像 **命名空间/仓库名**
* Dockerfile就是我们项目里已经编写好的dockerfile文件。

这个任务就可以实现打包我们的项目镜像并发布到配置中心了

#### stage2 部署到服务器
**创建 ssh 链接托管（service connection）**   
将服务务器部署到服务器上，需要用到ssh连接服务器。这里继续使用 azure 的 service connection 来创建
ssh 链接的托管。
**服务器准备好脚本**  
在服务器上需要准备好需要的脚本，方便直接部署。 现在继续写 pipeline 的 stage2。
```yaml
- stage: Deploy
  displayName: Deploy to Remote Server
  jobs:
  - job: DeployJob
    displayName: Deploy Image
    pool:
      vmImage: ubuntu-latest
    steps:
    - task: SSH@0
      displayName: Pull and Run Docker Image
      inputs:
        sshEndpoint: 'cheap-ecs'
        runOptions: 'inline'
        inline:  |
          cd ~
          export GPG_PASSWORD=$(gpgPassword)
          source ~/.profile
          echo $(dockerPassword) | docker login --username $(dockerUsername) --password-stdin $(dockerRegistryUrlVPC)
          echo "enter gpg password"
          # ./pass.sh
          echo $GPG_PASSWORD | gpg --batch --yes --passphrase-fd 0 --decrypt-files ~/.password-store/docker-credentials.gpg 2>&1
          echo "start pull image and run"
          bash ./deploy.sh '$(Build.BuildId)'
```
这里就直接看任务单元，
[task:SSH@0](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/ssh-v0?view=azure-pipelines&viewFallbackFrom=azure-devops) 这也是预设的 pipeline 命令
使用这个任务就可以借助配置好的 ssh 托管登录上远程服务器并执行命令。
* sshEndpoint 就是我创建的 ecs ssh 托管  
* runOptions: 'inline' 是命令行的运行选项。总共可以设置三个，具体看 devops 文档。  
* inline：这就是 inline 模式下，把服务器脚本直接写在 pipeline 中。
  * 从命令中可以看到我写的比较复杂，实际还用了环境变量，这块没有整理好，主要是为了保证
  密码安全。

按照上面的步骤，基本就完成了一个自己的可以运维的脚本配置了。






