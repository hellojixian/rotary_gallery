#!/bin/bash

# 360° 图片画廊功能测试脚本

echo "🧪 开始测试 360° 图片画廊..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "测试 $description... "
    
    response=$(curl -s -w "%{http_code}" "$url" -o /tmp/test_response)
    status_code=${response: -3}
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过${NC}"
        return 0
    else
        echo -e "${RED}✗ 失败 (状态码: $status_code)${NC}"
        return 1
    fi
}

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 测试计数器
passed=0
total=0

# 测试后端健康检查
total=$((total + 1))
if test_endpoint "http://localhost:3001/health" "后端健康检查"; then
    passed=$((passed + 1))
fi

# 测试前端页面
total=$((total + 1))
if test_endpoint "http://localhost:5173" "前端页面"; then
    passed=$((passed + 1))
fi

# 测试相册列表API
total=$((total + 1))
if test_endpoint "http://localhost:3001/api/albums" "相册列表API"; then
    passed=$((passed + 1))
    
    # 检查返回的相册数量
    album_count=$(curl -s "http://localhost:3001/api/albums" | jq '.data | length' 2>/dev/null)
    if [ "$album_count" -gt 0 ]; then
        echo -e "  ${GREEN}✓ 找到 $album_count 个相册${NC}"
    else
        echo -e "  ${YELLOW}⚠ 没有找到相册${NC}"
    fi
fi

# 测试特定相册API（如果有相册的话）
album_count=$(curl -s "http://localhost:3001/api/albums" | jq '.data | length' 2>/dev/null)
if [ "$album_count" -gt 0 ]; then
    # 获取第一个相册的ID
    first_album=$(curl -s "http://localhost:3001/api/albums" | jq -r '.data[0].id' 2>/dev/null)
    if [ "$first_album" != "null" ] && [ -n "$first_album" ]; then
        total=$((total + 1))
        encoded_album=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$first_album'))" 2>/dev/null || echo "$first_album")
        if test_endpoint "http://localhost:3001/api/albums/$encoded_album" "特定相册API ($first_album)"; then
            passed=$((passed + 1))
            
            # 测试图片服务
            first_image=$(curl -s "http://localhost:3001/api/albums/$encoded_album" | jq -r '.data.metadata.images[0]' 2>/dev/null)
            if [ "$first_image" != "null" ] && [ -n "$first_image" ]; then
                total=$((total + 1))
                if test_endpoint "http://localhost:3001/api/albums/$encoded_album/images/$first_image" "图片服务"; then
                    passed=$((passed + 1))
                fi
            fi
        fi
    fi
fi

# 测试静态文件服务
if [ "$album_count" -gt 0 ]; then
    first_album=$(curl -s "http://localhost:3001/api/albums" | jq -r '.data[0].id' 2>/dev/null)
    first_image=$(curl -s "http://localhost:3001/api/albums/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$first_album'))" 2>/dev/null || echo "$first_album")" | jq -r '.data.metadata.images[0]' 2>/dev/null)
    
    if [ "$first_image" != "null" ] && [ -n "$first_image" ]; then
        total=$((total + 1))
        encoded_album=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$first_album'))" 2>/dev/null || echo "$first_album")
        if test_endpoint "http://localhost:3001/static/albums/$encoded_album/$first_image" "静态文件服务"; then
            passed=$((passed + 1))
        fi
    fi
fi

# 输出测试结果
echo ""
echo "📊 测试结果:"
echo "   通过: $passed/$total"

if [ "$passed" -eq "$total" ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    echo ""
    echo "✅ 应用程序运行正常，可以开始使用："
    echo "   🌐 前端地址: http://localhost:5173"
    echo "   🔧 后端API: http://localhost:3001"
    echo ""
    echo "📱 功能特性："
    echo "   • 360度图片浏览"
    echo "   • 移动端触摸手势支持"
    echo "   • 自动播放功能"
    echo "   • 图片缩放和拖拽"
    echo "   • 键盘快捷键控制"
    exit 0
else
    echo -e "${RED}❌ 部分测试失败${NC}"
    echo ""
    echo "🔍 请检查："
    echo "   • 服务是否正常启动"
    echo "   • albums目录中是否有图片文件夹"
    echo "   • 端口3001和5173是否被占用"
    exit 1
fi
