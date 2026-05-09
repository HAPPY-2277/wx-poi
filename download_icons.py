import requests
import os

# 图片URL和文件名 - 使用简单的SVG图形作为占位符
images = [
    ('https://img.icons8.com/ios-filled/50/000000/add.png', 'add.png'),
    ('https://img.icons8.com/ios-filled/50/000000/task.png', 'task.png'),
    ('https://img.icons8.com/ios-filled/50/000000/list.png', 'list.png'),
    ('https://img.icons8.com/ios-filled/50/000000/map.png', 'map.png'),
]

# 保存目录
save_dir = 't:/POI/login_test/miniprogram/images/icons'

# 确保目录存在
os.makedirs(save_dir, exist_ok=True)

for url, filename in images:
    filepath = os.path.join(save_dir, filename)
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f'✓ 下载成功: {filename}')
        else:
            print(f'✗ 下载失败 [{response.status_code}]: {filename}')
    except Exception as e:
        print(f'✗ 错误 [{filename}]: {str(e)}')

print('\n下载完成!')