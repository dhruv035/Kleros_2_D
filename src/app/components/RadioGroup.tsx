'use client'
import { useState, useEffect, SyntheticEvent } from "react";
type Props = {
  radio: number;
  setRadio: (selection: number) => void;
};
import { moves } from "../lib/const";
const RadioGroup = ({ radio, setRadio }: Props) => {
  const handleSection = (e: SyntheticEvent<HTMLInputElement, Event>) => {
    setRadio(parseInt(e.currentTarget.value));
  };
  useEffect(() => {}, [radio]);
  return (
    <div className="flex flex-col">
      {
        moves.map((move,index)=>{
          return <div key={index} className="flex flex-row my-2">
          <input
            checked={radio === index+1}
            onChange={(e) => {
              handleSection(e);
            }}
            type="radio"
            value={(index+1).toString()}
          />
          <label>{move}</label>
        </div>
        })
      }
    </div>
  );
};

export default RadioGroup;
