# tracker.py

class TrackedElement:
    def __init__(self, val, idx, tracker):
        self.val = val
        self.idx = idx
        self.tracker = tracker

    def __lt__(self, other):
        self.tracker.log_comp(self.idx, other.idx)
        return self.val < other.val

    def __gt__(self, other):
        self.tracker.log_comp(self.idx, other.idx)
        return self.val > other.val

    def __eq__(self, other):
        self.tracker.log_comp(self.idx, other.idx)
        return self.val == other.val

    def __le__(self, other):
        self.tracker.log_comp(self.idx, other.idx)
        return self.val <= other.val

    def __ge__(self, other):
        self.tracker.log_comp(self.idx, other.idx)
        return self.val >= other.val


class TrackedArray:
    def __init__(self, user_arr):
        self.array = user_arr.copy()
        self.frames = []

    def __getitem__(self, i):
        return TrackedElement(self.array[i], i, self)

    def __setitem__(self, i, val):
        if isinstance(val, TrackedElement):
            real_val = val.val
        else:
            real_val = val

        if self.array[i] == real_val:
            return

        self.array[i] = real_val
        self.frames.append({"type": "update", "index": i, "value": real_val})

    def __len__(self):
        return len(self.array)

    def log_comp(self, i, j):
        self.frames.append({"type": "compare", "indexes": [i, j]})
        
    def get_result(self, start_arr):
        return {
            "metadata": {
                "size": len(self.array), 
                "initial_array": start_arr
            },
            "frames": self.frames
        }
