import yaml
import os

from typing import Any, Final


ROOT_PATH: Final[str] = "./src/packs/src/"


def strip_packs(obj: Any):
    if not isinstance(obj, dict):
        return
    for k, v in obj.copy().items():
        if k == "_stats":  # We don't want it
            del obj[k] 
        elif k == "ownership":  # We only want the default
            for i in obj[k].copy().keys():
                if i != "default":
                    del obj[k][i]
        else:
            strip_packs(obj[k])
    

print("Usage: python src/scripts/strip_packs.py\n")
for path in os.listdir(ROOT_PATH):
    path = ROOT_PATH + path
    if os.path.isfile(path):
        continue
    for f in os.listdir(path=path):
        filepath = f"{path}/{f}"
        print(f"Processing {filepath}...")
        with open(filepath) as stream:
            try:
                obj = yaml.safe_load(stream)
            except yaml.YAMLError as exc:
                print(exc)
        strip_packs(obj)
        with open(filepath, "w") as stream:
            yaml.dump(obj, stream, default_flow_style=False)
            
print("\nDone.")            
