# algos.py

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]

def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        j = i
        while j > 0 and arr[j - 1] > arr[j]:
            arr[j], arr[j - 1] = arr[j - 1], arr[j]
            j = j - 1

def merge_sort(arr):

    def _merge_sort(items, left, right):
        if right - left > 1:
            mid = (left + right) // 2
            _merge_sort(items, left, mid)
            _merge_sort(items, mid, right)
            _merge(items, left, mid, right)

    def _merge(items, left, mid, right):
        left_part = [items[i] for i in range(left, mid)]
        right_part = [items[i] for i in range(mid, right)]
        
        i = j = 0
        k = left
        
        while i < len(left_part) and j < len(right_part):
            if left_part[i] <= right_part[j]:
                items[k] = left_part[i]
                i += 1
            else:
                items[k] = right_part[j]
                j += 1
            k += 1
            
        while i < len(left_part):
            items[k] = left_part[i]
            i += 1
            k += 1
        while j < len(right_part):
            items[k] = right_part[j]
            j += 1
            k += 1

    _merge_sort(arr, 0, len(arr))

def shaker_sort(arr):
    n = len(arr)
    left = 0
    right = n - 1
    
    swapped = True
    
    while left < right and swapped:
        swapped = False
        
        for i in range(left, right):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
                
        right -= 1
        
        if not swapped:
            break
            
        swapped = False
        
        for i in range(right - 1, left - 1, -1):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
                
        left += 1

def timsort(arr):
    n = len(arr)
    if n <= 1:
        return

    min_run = _calculate_min_run(n)

    for start in range(0, n, min_run):
        end = min(start + min_run - 1, n - 1)
        _insertion_sort(arr, start, end)

    size = min_run
    while size < n:
        for left in range(0, n, 2 * size):
            mid = min(left + size - 1, n - 1)
            right = min(left + 2 * size - 1, n - 1)
            
            if mid < right:
                _merge(arr, left, mid, right)
        size *= 2

def _calculate_min_run(n):
    r = 0
    while n >= 64:
        r |= n & 1
        n >>= 1
    return n + r

def _insertion_sort(arr, left, right):
    for i in range(left + 1, right + 1):
        j = i
        while j > left and arr[j - 1] > arr[j]:
            arr[j], arr[j - 1] = arr[j - 1], arr[j]
            j -= 1

def _merge(arr, left, mid, right):
    len1 = mid - left + 1
    len2 = right - mid

    left_part = [arr[left + i] for i in range(len1)]
    right_part = [arr[mid + 1 + i] for i in range(len2)]

    i = 0
    j = 0
    k = left

    while i < len1 and j < len2:
        if left_part[i] <= right_part[j]:
            arr[k] = left_part[i]
            i += 1
        else:
            arr[k] = right_part[j]
            j += 1
        k += 1

    while i < len1:
        arr[k] = left_part[i]
        i += 1
        k += 1

    while j < len2:
        arr[k] = right_part[j]
        j += 1
        k += 1

def comb_sort(arr):
    n = len(arr)
    if n <= 1:
        return

    factor = 1.247
    gap = n
    swapped = True

    while gap > 1 or swapped:
        gap = int(gap / factor)
        if gap < 1:
            gap = 1

        swapped = False

        for i in range(0, n - gap):
            if arr[i] > arr[i + gap]:
                arr[i], arr[i + gap] = arr[i + gap], arr[i]
                swapped = True

def heap_sort(arr):
    n = len(arr)
    if n <= 1:
        return

    for i in range(n // 2 - 1, -1, -1):
        _heapify(arr, n, i)

    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]
        _heapify(arr, i, 0)

def _heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2

    if left < n and arr[left] > arr[largest]:
        largest = left

    if right < n and arr[right] > arr[largest]:
        largest = right

    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        _heapify(arr, n, largest)

def quick_sort(arr):
    _quick_sort_inplace(arr, 0, len(arr) - 1)

def _quick_sort_inplace(arr, low, high):
    if low < high:
        pivot_idx = _partition(arr, low, high)
        _quick_sort_inplace(arr, low, pivot_idx)
        _quick_sort_inplace(arr, pivot_idx + 1, high)

def _partition(arr, low, high):
    pivot = arr[(low + high) // 2]
    i = low - 1
    j = high + 1
    
    while True:
        while True:
            i += 1
            if arr[i] >= pivot:
                break
                
        while True:
            j -= 1
            if arr[j] <= pivot:
                break
                
        if i >= j:
            return j
            
        arr[i], arr[j] = arr[j], arr[i]

def stalin_sort(arr):
    n = len(arr)
    if n <= 1:
        return

    write_idx = 1
    
    for i in range(1, n):
        if arr[i] >= arr[write_idx - 1]:
            if i != write_idx:
                arr[write_idx], arr[i] = arr[i], arr[write_idx]
            write_idx += 1

    for i in range(write_idx, n):
        for j in range(i, n):
            if arr[j].val == 0:
                arr[i], arr[j] = arr[j], arr[i]
                break
        else:
            arr[i] = 0