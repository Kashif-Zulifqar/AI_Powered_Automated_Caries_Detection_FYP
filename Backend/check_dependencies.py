#!/usr/bin/env python3
"""
Diagnostic script — verify AI dependencies are available
Run this to check if all required packages can be imported
"""

import sys

print("=" * 70)
print("AI DEPENDENCIES DIAGNOSTIC")
print("=" * 70)
print(f"\nPython Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"Installation: {'Virtual Environment' if 'venv' in sys.executable else 'System Python'}")
print("\n" + "-" * 70)

dependencies = {
    "numpy": "Numerical computing",
    "cv2": "Image processing (OpenCV)",
    "PIL": "Image library (Pillow)",
    "torch": "Deep learning (PyTorch)",
    "ultralytics": "YOLO object detection",
    "flask": "Web framework",
    "pymongo": "MongoDB driver",
    "bcrypt": "Password hashing",
    "jwt": "JSON Web Tokens",
}

print("Checking required packages:\n")

missing = []
installed = []

for pkg_name, description in dependencies.items():
    try:
        __import__(pkg_name)
        print(f"  [OK]     {pkg_name:20} - {description}")
        installed.append(pkg_name)
    except ImportError as e:
        print(f"  [FAIL]   {pkg_name:20} - {description}")
        print(f"           Error: {str(e)[:60]}")
        missing.append(pkg_name)

print("\n" + "-" * 70)
print(f"\nInstalled: {len(installed)}/{len(dependencies)}")

if missing:
    print(f"Missing: {', '.join(missing)}")
    print("\nTo install missing packages, run:")
    print(f"  {sys.executable} -m pip install {' '.join(missing)}")
    sys.exit(1)
else:
    print("\nStatus: ALL DEPENDENCIES READY!")
    print("\nYou can now run the backend with:")
    print(f"  {sys.executable} app.py")
    sys.exit(0)
