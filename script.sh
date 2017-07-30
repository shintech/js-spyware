  software=software.txt
  readarray software_list < $software
    for software in "${software_list[@]}"; do
      echo \"$software\", >> test.txt
    done    