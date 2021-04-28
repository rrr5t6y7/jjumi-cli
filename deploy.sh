
# 压缩文件，其中 dist为要上传的文件所在目录
echo 压缩部署包！
tar -zcvf admin.tar.gz admin

# 上传到服务器（需要输入密码，如果已经进行过私钥配置，则不用），其中/home/savoygu/gusaifei 为上传文件所在目录
echo 上传文件
scp -r admin.tar.gz root@59.110.217.39:/root/nginx/www/admin/

# 登录到服务器（需要输入密码，如果已经进行过私钥配置，则不用）
# 服务器环境开启
ssh root@59.110.217.39 -tt << EOF

# 进入目标目录
cd /root/nginx/www/admin/
# 移除线上压缩文件
# sudo rm -rf ./*
# 解压
sudo tar -zxvf admin.tar.gz --strip-components 1
# 移除压缩文件
sudo rm -rf ./admin.tar.gz


exit
EOF
# 服务器环境结束
echo 上传完成！

# 移除本地压缩文件
echo 删除本地压缩包！
rm -rf admin.tar.gz
