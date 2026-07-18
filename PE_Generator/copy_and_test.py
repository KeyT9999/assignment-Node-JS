import os
import shutil
import subprocess
import sys

# Fix Windows terminal encoding for emoji/unicode
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUOCPE_NODE_MODULES = os.path.join(BASE_DIR, "SUOCPE", "node_modules")
TEAMPLATE8_DIR = os.path.join(BASE_DIR, "TeamPlate8")

folders = [
    "01_EventManagement",
    "02_CoWorkingBooking",
    "03_MovieTheaterBooking",
    "04_HospitalAppointment",
    "05_EquipmentRental",
    "06_CarRental",
    "07_SmartWarehouse",
    "08_EVChargingSystem"
]

def copy_node_modules_robocopy(src, dst):
    """Use Windows robocopy for fast parallel copying."""
    if os.path.exists(dst):
        print(f"  ⏭️  node_modules da ton tai tai {os.path.basename(os.path.dirname(dst))}")
        return True
    
    print(f"  📦 Dang copy node_modules sang {os.path.basename(os.path.dirname(dst))}...")
    # robocopy <source> <destination> /E
    # Exit codes 0-7 indicate success for robocopy
    cmd = ["robocopy", src, dst, "/E", "/MT:16", "/NFL", "/NDL", "/NJH", "/NJS"]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode < 8:
        print("  ✅ Copy hoan tat!")
        return True
    else:
        print(f"  ❌ Robocopy that bai voi code {res.returncode}")
        return False

def test_seed(folder_path, folder_name):
    print(f"  🧪 Dang test run 'npm run seed' trong {folder_name}...")
    try:
        # Run npm run seed
        res = subprocess.run(["npm", "run", "seed"], cwd=folder_path, capture_output=True, text=True, timeout=15, shell=True)
        if res.returncode == 0:
            print("  ✅ Seed THANH CONG!")
            print(f"     Stdout: {res.stdout.strip().split(chr(10))[-1]}")
            return True
        else:
            print(f"  ❌ Seed THAT BAI!")
            print(f"     Error: {res.stderr.strip() or res.stdout.strip()}")
            return False
    except Exception as e:
        print(f"  ❌ Loi khi thuc thi: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 Bat dau copy node_modules & Chay thu seeding 8 du an...")
    print("=" * 60)

    if not os.path.exists(SUOCPE_NODE_MODULES):
        print(f"❌ Khong tim thay nguon node_modules tai {SUOCPE_NODE_MODULES}")
        return

    success_count = 0
    for folder in folders:
        folder_path = os.path.join(TEAMPLATE8_DIR, folder)
        if not os.path.exists(folder_path):
            print(f"⚠️  Thu muc {folder} khong ton tai")
            continue
        
        dst_node_modules = os.path.join(folder_path, "node_modules")
        copied = copy_node_modules_robocopy(SUOCPE_NODE_MODULES, dst_node_modules)
        
        if copied:
            if test_seed(folder_path, folder):
                success_count += 1
        print("-" * 40)
        
    print()
    print("=" * 60)
    print(f"🎉 HOAN THANH: {success_count}/{len(folders)} du an khoi chay seed thanh cong!")
    print("=" * 60)

if __name__ == "__main__":
    main()
