---
title: "Python 패키지 구조화부터 PyPI 배포까지 정리"
date: 2026-08-02 15:17
updated_at: 2026-08-02 16:24
tags:
  - python
  - concept
  - deploy
description: "파이썬 패키지를 구조화하고 PyPI 공식 저장소에 배포하는 전체 절차 안내"
thumbnail: https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Python-Deploy-PyPI-Thumbnail.png
---

해당 포스팅에서는 우리의 파이썬 프로젝트를 `PyPI` 에 배포하는 방법을 다룹니다. 따라서 `PyPI` 에 회원가입이 되어있어야 합니다.

## PyPI 에 올라갈 패키지 구조화

우선 사용하고 싶은 파이썬 패키지 이름. 한마디로 `pip install`  에 사용할 패키지 이름으로 폴더를 생성합니다.

![Pasted image 20231231142636](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231142636.png)

### __init__.py 생성

이제 `__init__.py` 파일을 생성합니다. 생성하지 않으면 파이썬 패키지로 인식하지 않기때문에 꼭 생성해야 합니다.

![Pasted image 20231231142602](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231142602.png)

### 코드 작성 및 파일 이름 설정

이제 코드를 작성하고, 파일의 이름을 설정합니다. 해당 폴더에 있는 내용들이 그대로 `PyPI` 에 패키지화 되어 올라가기 때문입니다. 또한 여기서 설정한 파이썬 파일이름이 `import` 문으로 사용됩니다.

![Pasted image 20231231143003](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143003.png)

여기까지 준비되었으면 `PyPI` 에 바로 패키지화해서 올릴 수 있습니다. 해당 패키지에 대한 정보, 라이센스를 명시하기위해 여러 파일을 작성하는 것이 좋습니다.

## 프로젝트 Root 에 파일 작성

### .gitignore 파일 작성

 `.gitignore` 파일은 Github 에 올리지 않을 파일들을 명시하는 파일입니다. 사실 PyPI 에 배포할때는 필요없지만, 일반적으로 PyPI, Github 두곳에 모두 배포하기 때문에 작성하는 것이 좋습니다.
 
> PyPI 에 올라갈 패키지 폴더 밖에다가 작성해야 합니다.

![Pasted image 20231231143228](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143228.png)

### LICENSE 파일 작성

이제 `LICENSE` 파일을 작성합니다. 해당 파일은 오픈소스에는 거의 무조건 들어있는 파일입니다. 오픈소스 LICENSE 에는 여러가지가 있지만, 여기서는 `MIT LICENSE` 를 사용합니다. 인터넷에 검색해보면 많습니다.

![Pasted image 20231231143305](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143305.png)

> MIT LICENSE 는 BSD 라이센스를 기초로 MIT 대학에서 제정했으며, MIT 라이센스를 따라는 SW 를 사용하여 개발 시, 만든 개발품을 꼭 오픈소스로 공개할 필요는없으며, 소스코드 또한 공개할 의무도 없습니다.

```text
Copyright (c) 2023 Revi1337

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sub-license, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice, and every other copyright notice found in this
software, and all the attributions in every file, and this permission notice
shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### README.md 작성

`README.md`  는 `PyPI` 와 `Github` 에 배포했을때 아래와 같이 대문짝만하게 뜨는 글입니다. 해당 파일은 프로젝트의 얼굴과도 다름없기 때문에 꼭 작성하는 것이 좋습니다. 다 알고있겠지만 Markdown 으로 작성하면 됩니다.

![Pasted image 20231231025205](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231025205.png)

### requirements.txt 작성

`requiremenets.txt` 는 우리의 패키지를 설치할때 `어떤 패키지가 필요한지` 명시하는 파일입니다. 한마디로 우리의 패키지에서 의존하고있는 외부 파이썬 패키지를 명시하면 됩니다.

![Pasted image 20231231143450](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143450.png)

`requiremenets.txt` 파일은 아래의 커맨드로 손쉽게 만들 수 있습니다.

```bash
$ pip freeze > requirements.txt
```

![Pasted image 20231231025929](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231025929.png)

> requirements.txt 는 단순히 우리의 프로젝트가 어떠한 의존성을 갖고 있는지를 나타내는 파일입니다.

### MANIFEST.in 작성

`MANIFEST.in` 파일은 우리의 코드를 패키지화할때 어떤 파일을 함께 패키지화할지 명시하는 파일입니다. 

아래와 같은 패키지 구조가 있다고 했을때,  최상위 디렉터리를 기준으로 함께 패키지하고 싶은 파이썬과 관련없는 파일을 명시하면 됩니다.

![Pasted image 20231231143648](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143648.png)

대표적으로 앞서 작성한 `LICENSE`, `requirements.txt`, `README.md` 파일과 같이 파이썬 확장자가 아닌 파일을 명시하면 됩니다. 이 때 `include` 를 prefix 로 사용하면 됩니다. 또한, `global-exclude` prefix 로 패키지화 하고싶지 않은 파일을 명시할 수 있습니다.

![Pasted image 20231231030741](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231030741.png)

### setup.py 작성

`setup.py` 는 우리의 프로젝트가 패키지로 정의하기위해 사용되는 파일입니다. 패키지된 우리의 프로젝트가 배포될 때 문제 없이 배포될 수 있도록 메타데이터를 적으면 됩니다. 이 메타데이터에는 명칭, 버전, 의존성 등을 적게 됩니다. 

![Pasted image 20231231143727](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143727.png)

- `name` :  PyPI 에 업로드할 이름을 명시하면 됩니다. 이때 중복되는 이름이면 안됩니다.
- `description` : 패키지에 대한 설명을 적으면 됩니다.
- `install_requires` :  우리의 패키지를 설치할때 필요한 의존성을 명시하면 됩니다. 해당 설정으로 우리의 패키지를 설치할때 이러한 의존성들도 같이 설치됩니다.
- `packages` : find_packages() 를 입력하면 됩니다. `find_packages()` 는` setuptools` 에서 제공하는 함수 중 하나이며 해당 함수를 사용하게 되면 수동으로 각 패키지를 지정할 필요 없이, 프로젝트 내에 있는 패키지들을 자동으로 찾아 사용할 수 있게 됩니다.
- `entry_points` : 우리의 패키지를 설치한 후에` 실행 가능한 명령어나 스크립트를 등록`하는데 사용됩니다. 우리의 패키지를 설치하게 되면 추가적인 명령어나 동작을 제공할 수 있습니다. 현재 예로는 `image-commit` 을 콘솔창에 치게되면 `obsidian-git-uploader` 폴더 하위 `image_upload.py` 의 `main` 함수를 실행시키겠다는 의미가 됩니다.
- `keywords` : 우리의 패키지가 검색되기 위한 keyword 를 명시하면 됩니다. 일종의 tag 라고 보면 됩니다.
- `python_requires` : 우리의 패키지가 실행되기 위한 파이썬 버전을 명시하면 됩니다.
- `classifiers` :  패키지가 PyPI 에 업로드될 때 해당 패키지에 대한 추가 정보를 제공하는데 사용됩니다.  해당 정보는 패키지의 특징, 지원되는 Python 버전, 라이센스 유형 등을 명시하면 됩니다

```python
from setuptools import setup, find_packages  
  
setup(  
    name             = 'obsidian_git_uploader',  
    version          = '1.0.0',  
    description      = 'Git Image Commiter',  
    author           = 'Revi1337',  
    author_email     = 'david122123@gmail.com',  
    url              = '',  
    download_url     = '',  
    install_requires = [  
        'requests',  
        'beautifulsoup4',  
        'clipboard',  
        'Markdown',  
        'aiohttp'  
    ],  
   include_package_data=True,  
   packages         = find_packages(),  
    entry_points     = {  
        'console_scripts': [  
            'image-commit = obsidian_git_uploader.image_upload:main'  
        ]  
    },  
    keywords         = [  
        'GIT COMMITER',  
        'git commiter',  
        'IMAGE COMMITER',  
        'image commiter'  
    ],  
    python_requires  = '>=3',  
    zip_safe=False,  
    classifiers      = [  
        "Programming Language :: Python :: 3.11",  
        "License :: OSI Approved :: MIT License",  
        "Operating System :: Microsoft :: Windows"  
    ]  
)
```

### setup.cfg 작성 (Optional)

해당 파일은  `setup.py` 에 대해 좀 더 자세히 옵션을 설정하는 파일입니다. `setup.cfg` 포맷에 맞게 옵션을 작성하고 `setup.py` 와 같이 프로젝트 루트에 두면 자동으로 setuptools가 `setup.cfg` 파일을 찾아서 설정을 오버라이드 된다고 합니다.

![Pasted image 20231231143816](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231143816.png)

## 배포를 위한 패키지 설치

`wheel` 패키지는 우리의 파일을 압축하여 실행파일 형태로 만드는 역할을 합니다. 또한, `setuptools` 는 setup.py 를 실행하여 설치와 관련된 역할을 하게 됩니다.  마지막으로 `twine` 은 PyPI 에 배포를 가능하게 하는 역할을 합니다.

```bash
$ pip install setuptools wheel twine
```

- setuptools
	- 패키지 빌드, 배포, 설치 등의 작업을 위한 도구.
	- `setup.py` 파일을 사용하여 패키지 메타데이터 설정 및 패키지 빌드를 담당합니다.

- wheel
	- Python 패키지의 배포 포맷인 `.whl` 형식으로 빌드하기 위한 도구입니다.
	- `wheel`은 Python 프로젝트를 미리 빌드된 바이너리 포맷으로 패키징하는 데 사용됩니다.
	- `pip`를 통해 `.whl` 파일을 더 빠르게 설치할 수 있게합니다.
	- `setuptools`를 사용하여 빌드된 패키지를 `wheel` 형식으로 만들 수 있습니다.

- twine
	- PyPI 에 배포하게 할 수 있는 패키지입니다. 파이썬에서 PyPI 에 패키지를 배포할때 해당 패키지를 사용하도록 권고하고 있습니다.

일반적으로 `setuptools`는 패키지의 빌드, 설치, 의존성 관리 등을 다루고, `wheel`은 미리 빌드된 패키지 형식을 만들고 배포할 때 사용됩니다. `setuptools`를 사용하여 패키지를 빌드하고, 그 빌드된 패키지를 `wheel` 포맷으로 변환하여 배포하는 것이 일반적인 방식입니다.

## 빌드 및 배포

이제 아래의 커맨드로 빌드를 수행합니다. 빌드를 하게 되면 프로젝트 Root 에 `dist` 폴더가 생기게 되는데 그 폴더들의 모든 파일들을 `PyPI` 에 배포시키면 됩니다.

```bash
$ python setup.py sdist bdist_wheel
```

![Pasted image 20231231144408](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231144408.png)


이제 아래의 커맨드를 통해 PyPI 에 dist 하위 모든 파일들을 배포하면 됩니다. 콘솔에서 `PyPI` 의 Id, password 를 입력하고 PyPI 에 배포하면 됩니다.

```bash
$ python -m twine upload dist/*
```

![Pasted image 20231231144641](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231144641.png)

## PyPI 배포 확인

`setup.py` 에서 작성한 `keywords` 내용중 하나를 입력해보면 방금 배포한 우리의 패키지가 잘 나오는것을 확인할 수 있습니다.

![Pasted image 20231231145306](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231145306.png)

## 배포한 패키지 설치 확인

이제 새로운 작업환경을 만든 후, 우리가 배포한 패키지를 설치해봅니다. `pip install 패키지이름` 으로 우리가 배포한 패키지를 설치할 수 있습니다. 여기서 패키지 이름은 `setup.py` 에서 작성한 `name` 값을 명시하면 됩니다.

`setup.py` 에서 명시한 `install_requires` 를 참조하여 의존성들을 자동으로 설치하는 것을 볼 수 있습니다.

![Pasted image 20231231150638](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231150638.png)


패키지를 설치했으니 `setup.py` 에서 명시한 `entry_points` 에 의해 `image-commit` 라는 명령어가 등록되었을 것입니다. 이것을 실행해보면 잘 동작하는 것을 확인할 수 있습니다.

![Pasted image 20231231151051](https://pub-8c61ed96347b483a91c17765cea907da.r2.dev/images/2026-08-02/Pasted-image-20231231151051.png)
