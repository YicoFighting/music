1. 不同平台歌词解析不一致

## Github 提交

```shell
# SOCKS5代理（如使用Clash、V2Ray等）
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy https://127.0.0.1:7897

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```